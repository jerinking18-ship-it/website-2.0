-- CreateTable
CREATE TABLE "BusinessReportPreference" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "range" TEXT NOT NULL DEFAULT '7 days',
    "category" TEXT NOT NULL DEFAULT 'All categories',
    "payment" TEXT NOT NULL DEFAULT 'All payments',
    "zone" TEXT NOT NULL DEFAULT 'All zones',
    "segment" TEXT NOT NULL DEFAULT 'All customers',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessReportPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessReportExport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Processing',
    "time" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessReportPreference_key_key" ON "BusinessReportPreference"("key");
CREATE INDEX "BusinessReportExport_status_idx" ON "BusinessReportExport"("status");
CREATE INDEX "BusinessReportExport_format_idx" ON "BusinessReportExport"("format");

-- Preserve report preferences entered before reports had dedicated tables.
INSERT INTO "BusinessReportPreference" ("id", "key", "range", "category", "payment", "zone", "segment", "updatedAt")
VALUES (
  'business-report-preference-default',
  'default',
  COALESCE(
    (SELECT CASE
      WHEN jsonb_typeof("payload"::jsonb) = 'string' THEN "payload"::jsonb #>> '{}'
      ELSE NULL
    END FROM "AdminState" WHERE "key" = 'admin-state:reports:range' LIMIT 1),
    '7 days'
  ),
  COALESCE((SELECT NULLIF("payload"::jsonb->>'category', '') FROM "AdminState" WHERE "key" = 'admin-state:reports:filters' AND jsonb_typeof("payload"::jsonb) = 'object' LIMIT 1), 'All categories'),
  COALESCE((SELECT NULLIF("payload"::jsonb->>'payment', '') FROM "AdminState" WHERE "key" = 'admin-state:reports:filters' AND jsonb_typeof("payload"::jsonb) = 'object' LIMIT 1), 'All payments'),
  COALESCE((SELECT NULLIF("payload"::jsonb->>'zone', '') FROM "AdminState" WHERE "key" = 'admin-state:reports:filters' AND jsonb_typeof("payload"::jsonb) = 'object' LIMIT 1), 'All zones'),
  COALESCE((SELECT NULLIF("payload"::jsonb->>'segment', '') FROM "AdminState" WHERE "key" = 'admin-state:reports:filters' AND jsonb_typeof("payload"::jsonb) = 'object' LIMIT 1), 'All customers'),
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "BusinessReportExport" ("id", "title", "format", "status", "time", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'RP-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'title', ''), 'Business report export'),
  COALESCE(NULLIF(value->>'format', ''), 'PDF'),
  COALESCE(NULLIF(value->>'status', ''), 'Processing'),
  NULLIF(value->>'time', ''),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:reports:exports'
ON CONFLICT ("id") DO NOTHING;
