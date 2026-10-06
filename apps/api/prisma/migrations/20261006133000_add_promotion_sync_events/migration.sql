CREATE TABLE IF NOT EXISTS "PromotionSyncEventRecord" (
  "id" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PromotionSyncEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PromotionSyncEventRecord_updatedAt_idx" ON "PromotionSyncEventRecord"("updatedAt");

INSERT INTO "PromotionSyncEventRecord" ("id", "message", "time", "createdAt", "updatedAt")
SELECT
  COALESCE(NULLIF(element->>'id', ''), 'SYNC-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  COALESCE(NULLIF(element->>'message', ''), 'Promotion sync completed.'),
  COALESCE(NULLIF(element->>'time', ''), 'Imported from admin state'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AdminState"
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb
    ELSE '[]'::jsonb
  END
) AS element
WHERE "key" = 'admin-state:promotions:sync-events'
ON CONFLICT ("id") DO UPDATE SET
  "message" = EXCLUDED."message",
  "time" = EXCLUDED."time",
  "updatedAt" = CURRENT_TIMESTAMP;
