CREATE TABLE IF NOT EXISTS "CategoryProductMapping" (
  "sku" TEXT NOT NULL,
  "product" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "sales" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CategoryProductMapping_pkey" PRIMARY KEY ("sku")
);

CREATE INDEX IF NOT EXISTS "CategoryProductMapping_categoryId_idx" ON "CategoryProductMapping"("categoryId");
CREATE INDEX IF NOT EXISTS "CategoryProductMapping_status_idx" ON "CategoryProductMapping"("status");

CREATE TABLE IF NOT EXISTS "CategoryOfferPlacement" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "placement" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Scheduled',
  "valid" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CategoryOfferPlacement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CategoryOfferPlacement_categoryId_idx" ON "CategoryOfferPlacement"("categoryId");
CREATE INDEX IF NOT EXISTS "CategoryOfferPlacement_status_idx" ON "CategoryOfferPlacement"("status");

INSERT INTO "CategoryProductMapping" ("sku", "product", "categoryId", "status", "sales", "createdAt", "updatedAt")
SELECT
  UPPER(element->>'sku'),
  COALESCE(NULLIF(element->>'product', ''), UPPER(element->>'sku')),
  element->>'categoryId',
  COALESCE(NULLIF(element->>'status', ''), 'Active'),
  COALESCE(NULLIF(element->>'sales', ''), 'Rs. 0'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AdminState"
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb
    ELSE '[]'::jsonb
  END
) AS element
WHERE "key" = 'admin-state:categories:mappings'
  AND NULLIF(element->>'sku', '') IS NOT NULL
  AND NULLIF(element->>'categoryId', '') IS NOT NULL
ON CONFLICT ("sku") DO UPDATE SET
  "product" = EXCLUDED."product",
  "categoryId" = EXCLUDED."categoryId",
  "status" = EXCLUDED."status",
  "sales" = EXCLUDED."sales",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "CategoryOfferPlacement" ("id", "categoryId", "title", "placement", "status", "valid", "createdAt", "updatedAt")
SELECT
  COALESCE(NULLIF(element->>'id', ''), 'CO-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  element->>'categoryId',
  COALESCE(NULLIF(element->>'title', ''), 'Category offer'),
  COALESCE(NULLIF(element->>'placement', ''), 'Category banner'),
  COALESCE(NULLIF(element->>'status', ''), 'Scheduled'),
  NULLIF(element->>'valid', ''),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AdminState"
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb
    ELSE '[]'::jsonb
  END
) AS element
WHERE "key" = 'admin-state:categories:offers'
  AND NULLIF(element->>'categoryId', '') IS NOT NULL
ON CONFLICT ("id") DO UPDATE SET
  "categoryId" = EXCLUDED."categoryId",
  "title" = EXCLUDED."title",
  "placement" = EXCLUDED."placement",
  "status" = EXCLUDED."status",
  "valid" = EXCLUDED."valid",
  "updatedAt" = CURRENT_TIMESTAMP;
