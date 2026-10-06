-- CreateTable
CREATE TABLE "AdminStaffProfile" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "phone" TEXT,
    "shift" TEXT,
    "zone" TEXT,
    "performance" TEXT,
    "rating" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminStaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminStaffShift" (
    "id" TEXT NOT NULL,
    "staffId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminStaffShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminStaffActivity" (
    "id" TEXT NOT NULL,
    "staffId" TEXT,
    "staff" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "risk" TEXT NOT NULL DEFAULT 'Low',
    "time" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminStaffActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminStaffProfile_adminUserId_key" ON "AdminStaffProfile"("adminUserId");
CREATE INDEX "AdminStaffShift_staffId_idx" ON "AdminStaffShift"("staffId");
CREATE INDEX "AdminStaffShift_state_idx" ON "AdminStaffShift"("state");
CREATE INDEX "AdminStaffShift_zone_idx" ON "AdminStaffShift"("zone");
CREATE INDEX "AdminStaffActivity_staffId_idx" ON "AdminStaffActivity"("staffId");
CREATE INDEX "AdminStaffActivity_risk_idx" ON "AdminStaffActivity"("risk");
CREATE INDEX "AdminStaffActivity_module_idx" ON "AdminStaffActivity"("module");

-- Preserve staff directory details that were entered before the staff profile table existed.
INSERT INTO "AdminUser" ("id", "email", "passwordHash", "name", "status", "twoFactorEnabled", "createdAt", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'staff-' || md5(COALESCE(value->>'email', random()::text))),
  lower(COALESCE(NULLIF(value->>'email', ''), 'staff-' || md5(random()::text) || '@freshcart.local')),
  'scrypt:disabled:disabled',
  COALESCE(NULLIF(value->>'name', ''), 'Staff member'),
  CASE
    WHEN lower(COALESCE(value->>'status', '')) LIKE '%invite%' THEN 'INVITED'::"AdminStatus"
    WHEN lower(COALESCE(value->>'status', '')) LIKE '%suspend%' OR lower(COALESCE(value->>'status', '')) LIKE '%offline%' THEN 'DISABLED'::"AdminStatus"
    ELSE 'ACTIVE'::"AdminStatus"
  END,
  CASE WHEN lower(COALESCE(value->>'twoFactor', 'false')) IN ('true', 'on', '1', 'yes') THEN true ELSE false END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:staff:team:v2'
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "AdminStaffProfile" ("id", "adminUserId", "phone", "shift", "zone", "performance", "rating", "updatedAt")
SELECT
  'profile-' || "AdminUser"."id",
  "AdminUser"."id",
  NULLIF(value->>'phone', ''),
  NULLIF(value->>'shift', ''),
  NULLIF(value->>'zone', ''),
  NULLIF(value->>'performance', ''),
  NULLIF(value->>'rating', ''),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
JOIN "AdminUser" ON "AdminUser"."email" = lower(COALESCE(NULLIF(value->>'email', ''), ''))
WHERE "AdminState"."key" = 'admin-state:staff:team:v2'
ON CONFLICT ("adminUserId") DO NOTHING;

INSERT INTO "AdminRole" ("id", "name", "description", "createdAt", "updatedAt")
SELECT
  'role-' || md5(COALESCE(value->>'role', 'Support Agent')),
  COALESCE(NULLIF(value->>'role', ''), 'Support Agent'),
  COALESCE(NULLIF(value->>'access', ''), 'Imported staff role'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" IN ('admin-state:staff:team:v2', 'admin-state:staff:roles:v2')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "AdminUserRole" ("adminUserId", "roleId", "createdAt")
SELECT
  "AdminUser"."id",
  "AdminRole"."id",
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
JOIN "AdminUser" ON "AdminUser"."email" = lower(COALESCE(NULLIF(value->>'email', ''), ''))
JOIN "AdminRole" ON "AdminRole"."name" = COALESCE(NULLIF(value->>'role', ''), 'Support Agent')
WHERE "AdminState"."key" = 'admin-state:staff:team:v2'
ON CONFLICT ("adminUserId", "roleId") DO NOTHING;

INSERT INTO "AdminStaffShift" ("id", "name", "role", "shift", "zone", "state", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'SHIFT-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'name', ''), 'Staff member'),
  COALESCE(NULLIF(value->>'role', ''), 'Support Agent'),
  COALESCE(NULLIF(value->>'shift', ''), 'Not scheduled'),
  COALESCE(NULLIF(value->>'zone', ''), 'Unassigned'),
  COALESCE(NULLIF(value->>'state', ''), 'Scheduled'),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:staff:shifts'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AdminStaffActivity" ("id", "staff", "action", "module", "risk", "time", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'AC-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'staff', ''), 'Staff member'),
  COALESCE(NULLIF(value->>'action', ''), 'Staff activity'),
  COALESCE(NULLIF(value->>'module', ''), 'Staff'),
  replace(COALESCE(NULLIF(value->>'risk', ''), 'Low'), ' risk', ''),
  NULLIF(value->>'time', ''),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:staff:activities'
ON CONFLICT ("id") DO NOTHING;
