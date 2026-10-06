CREATE TABLE IF NOT EXISTS "SupplierExportRecord" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'CSV',
  "status" TEXT NOT NULL DEFAULT 'Ready',
  "time" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupplierExportRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupplierExportRecord_status_idx" ON "SupplierExportRecord"("status");
CREATE INDEX IF NOT EXISTS "SupplierExportRecord_format_idx" ON "SupplierExportRecord"("format");

INSERT INTO "SupplierExportRecord" ("id", "title", "format", "status", "time", "createdAt", "updatedAt")
SELECT
  COALESCE(NULLIF(element->>'id', ''), 'SX-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  COALESCE(NULLIF(element->>'title', ''), 'Supplier export'),
  COALESCE(NULLIF(element->>'format', ''), 'CSV'),
  COALESCE(NULLIF(element->>'status', ''), 'Ready'),
  NULLIF(element->>'time', ''),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AdminState"
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb
    ELSE '[]'::jsonb
  END
) AS element
WHERE "key" = 'admin-state:suppliers:exports'
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "format" = EXCLUDED."format",
  "status" = EXCLUDED."status",
  "time" = EXCLUDED."time",
  "updatedAt" = CURRENT_TIMESTAMP;
