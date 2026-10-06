-- CreateTable
CREATE TABLE "AuditActivityReview" (
    "id" TEXT NOT NULL,
    "auditLogId" TEXT NOT NULL,
    "admin" TEXT,
    "email" TEXT,
    "role" TEXT,
    "module" TEXT,
    "action" TEXT,
    "target" TEXT,
    "timestamp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "ip" TEXT,
    "device" TEXT,
    "location" TEXT,
    "risk" TEXT NOT NULL DEFAULT 'Low',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditActivityReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditSecurityEvent" (
    "id" TEXT NOT NULL,
    "admin" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'Success',
    "timestamp" TEXT,
    "ip" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "location" TEXT,
    "risk" TEXT NOT NULL DEFAULT 'Low',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditSecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditDataChange" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordName" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "timestamp" TEXT,
    "risk" TEXT NOT NULL DEFAULT 'Low',
    "approval" TEXT NOT NULL DEFAULT 'Not required',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditDataChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditAdminSessionRecord" (
    "id" TEXT NOT NULL,
    "admin" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "loginTime" TEXT,
    "lastActivity" TEXT,
    "ip" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "twoFactor" TEXT NOT NULL DEFAULT 'Pending',
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "risk" TEXT NOT NULL DEFAULT 'Low',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditAdminSessionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditExportRecord" (
    "id" TEXT NOT NULL,
    "admin" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'CSV',
    "dateRange" TEXT,
    "rows" TEXT NOT NULL DEFAULT '0',
    "status" TEXT NOT NULL DEFAULT 'Ready',
    "downloadTime" TEXT,
    "ip" TEXT,
    "reason" TEXT,
    "review" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditExportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRiskAlert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "risk" TEXT NOT NULL DEFAULT 'High',
    "admin" TEXT NOT NULL,
    "timestamp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditRiskAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "retention" TEXT NOT NULL DEFAULT '365 days',
    "trackIp" BOOLEAN NOT NULL DEFAULT true,
    "trackLocation" BOOLEAN NOT NULL DEFAULT true,
    "trackDevice" BOOLEAN NOT NULL DEFAULT true,
    "trackBeforeAfter" BOOLEAN NOT NULL DEFAULT true,
    "requireReason" BOOLEAN NOT NULL DEFAULT true,
    "ownerApproval" BOOLEAN NOT NULL DEFAULT true,
    "highRiskAlerts" BOOLEAN NOT NULL DEFAULT true,
    "ownerOnlyExport" BOOLEAN NOT NULL DEFAULT true,
    "maskCustomerData" BOOLEAN NOT NULL DEFAULT true,
    "autoLockSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "immutableSecurityEvents" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditActivityReview_auditLogId_key" ON "AuditActivityReview"("auditLogId");
CREATE INDEX "AuditActivityReview_status_idx" ON "AuditActivityReview"("status");
CREATE INDEX "AuditActivityReview_risk_idx" ON "AuditActivityReview"("risk");
CREATE INDEX "AuditSecurityEvent_email_idx" ON "AuditSecurityEvent"("email");
CREATE INDEX "AuditSecurityEvent_risk_idx" ON "AuditSecurityEvent"("risk");
CREATE INDEX "AuditSecurityEvent_status_idx" ON "AuditSecurityEvent"("status");
CREATE INDEX "AuditDataChange_module_idx" ON "AuditDataChange"("module");
CREATE INDEX "AuditDataChange_recordId_idx" ON "AuditDataChange"("recordId");
CREATE INDEX "AuditDataChange_risk_idx" ON "AuditDataChange"("risk");
CREATE INDEX "AuditDataChange_status_idx" ON "AuditDataChange"("status");
CREATE INDEX "AuditAdminSessionRecord_email_idx" ON "AuditAdminSessionRecord"("email");
CREATE INDEX "AuditAdminSessionRecord_status_idx" ON "AuditAdminSessionRecord"("status");
CREATE INDEX "AuditAdminSessionRecord_risk_idx" ON "AuditAdminSessionRecord"("risk");
CREATE INDEX "AuditExportRecord_module_idx" ON "AuditExportRecord"("module");
CREATE INDEX "AuditExportRecord_status_idx" ON "AuditExportRecord"("status");
CREATE INDEX "AuditExportRecord_review_idx" ON "AuditExportRecord"("review");
CREATE INDEX "AuditRiskAlert_module_idx" ON "AuditRiskAlert"("module");
CREATE INDEX "AuditRiskAlert_risk_idx" ON "AuditRiskAlert"("risk");
CREATE INDEX "AuditRiskAlert_status_idx" ON "AuditRiskAlert"("status");
CREATE UNIQUE INDEX "AuditSettings_key_key" ON "AuditSettings"("key");

-- Preserve any real records that were entered before this domain table existed.
INSERT INTO "AuditSecurityEvent" ("id", "admin", "email", "eventType", "result", "timestamp", "ip", "device", "browser", "location", "risk", "status", "note", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'ASE-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'admin', ''), 'Admin'),
  COALESCE(NULLIF(value->>'email', ''), 'admin@freshcart.local'),
  COALESCE(NULLIF(value->>'eventType', ''), 'Security event'),
  COALESCE(NULLIF(value->>'result', ''), 'Success'),
  NULLIF(value->>'timestamp', ''),
  NULLIF(value->>'ip', ''),
  NULLIF(value->>'device', ''),
  NULLIF(value->>'browser', ''),
  NULLIF(value->>'location', ''),
  COALESCE(NULLIF(value->>'risk', ''), 'Low'),
  COALESCE(NULLIF(value->>'status', ''), 'Open'),
  NULLIF(value->>'note', ''),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:audit:security-events'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AuditDataChange" ("id", "module", "recordId", "recordName", "field", "oldValue", "newValue", "changedBy", "reason", "timestamp", "risk", "approval", "status", "note", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'ADC-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'module', ''), 'Admin'),
  COALESCE(NULLIF(value->>'recordId', ''), '-'),
  COALESCE(NULLIF(value->>'recordName', ''), 'Record'),
  COALESCE(NULLIF(value->>'field', ''), 'Field'),
  NULLIF(value->>'oldValue', ''),
  NULLIF(value->>'newValue', ''),
  COALESCE(NULLIF(value->>'changedBy', ''), 'Admin'),
  NULLIF(value->>'reason', ''),
  NULLIF(value->>'timestamp', ''),
  COALESCE(NULLIF(value->>'risk', ''), 'Low'),
  COALESCE(NULLIF(value->>'approval', ''), 'Not required'),
  COALESCE(NULLIF(value->>'status', ''), 'Open'),
  NULLIF(value->>'note', ''),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:audit:data-changes'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AuditAdminSessionRecord" ("id", "admin", "email", "role", "loginTime", "lastActivity", "ip", "device", "browser", "location", "status", "twoFactor", "trusted", "risk", "note", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'ASN-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'admin', ''), 'Admin'),
  COALESCE(NULLIF(value->>'email', ''), 'admin@freshcart.local'),
  NULLIF(value->>'role', ''),
  NULLIF(value->>'loginTime', ''),
  NULLIF(value->>'lastActivity', ''),
  NULLIF(value->>'ip', ''),
  NULLIF(value->>'device', ''),
  NULLIF(value->>'browser', ''),
  NULLIF(value->>'location', ''),
  COALESCE(NULLIF(value->>'status', ''), 'Active'),
  COALESCE(NULLIF(value->>'twoFactor', ''), 'Pending'),
  COALESCE((value->>'trusted')::boolean, false),
  COALESCE(NULLIF(value->>'risk', ''), 'Low'),
  NULLIF(value->>'note', ''),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:audit:sessions'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AuditExportRecord" ("id", "admin", "email", "exportType", "module", "format", "dateRange", "rows", "status", "downloadTime", "ip", "reason", "review", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'AEX-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'admin', ''), 'Admin'),
  COALESCE(NULLIF(value->>'email', ''), 'admin@freshcart.local'),
  COALESCE(NULLIF(value->>'exportType', ''), 'Audit export'),
  COALESCE(NULLIF(value->>'module', ''), 'Audit Logs'),
  COALESCE(NULLIF(value->>'format', ''), 'CSV'),
  NULLIF(value->>'dateRange', ''),
  COALESCE(NULLIF(value->>'rows', ''), '0'),
  COALESCE(NULLIF(value->>'status', ''), 'Ready'),
  NULLIF(value->>'downloadTime', ''),
  NULLIF(value->>'ip', ''),
  NULLIF(value->>'reason', ''),
  COALESCE(NULLIF(value->>'review', ''), 'Open'),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:audit:exports'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AuditRiskAlert" ("id", "alertType", "module", "target", "trigger", "risk", "admin", "timestamp", "status", "ownerNote", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'ARA-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'alertType', ''), 'Risk alert'),
  COALESCE(NULLIF(value->>'module', ''), 'Admin'),
  COALESCE(NULLIF(value->>'target', ''), '-'),
  COALESCE(NULLIF(value->>'trigger', ''), 'Manual review'),
  COALESCE(NULLIF(value->>'risk', ''), 'High'),
  COALESCE(NULLIF(value->>'admin', ''), 'Admin'),
  NULLIF(value->>'timestamp', ''),
  COALESCE(NULLIF(value->>'status', ''), 'Open'),
  NULLIF(value->>'ownerNote', ''),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:audit:risk-alerts'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AuditSettings" ("id", "key", "retention", "trackIp", "trackLocation", "trackDevice", "trackBeforeAfter", "requireReason", "ownerApproval", "highRiskAlerts", "ownerOnlyExport", "maskCustomerData", "autoLockSuspicious", "immutableSecurityEvents", "updatedAt")
SELECT
  'audit-settings-default',
  'default',
  COALESCE(NULLIF("payload"::jsonb->>'retention', ''), '365 days'),
  COALESCE(("payload"::jsonb->>'trackIp')::boolean, true),
  COALESCE(("payload"::jsonb->>'trackLocation')::boolean, true),
  COALESCE(("payload"::jsonb->>'trackDevice')::boolean, true),
  COALESCE(("payload"::jsonb->>'trackBeforeAfter')::boolean, true),
  COALESCE(("payload"::jsonb->>'requireReason')::boolean, true),
  COALESCE(("payload"::jsonb->>'ownerApproval')::boolean, true),
  COALESCE(("payload"::jsonb->>'highRiskAlerts')::boolean, true),
  COALESCE(("payload"::jsonb->>'ownerOnlyExport')::boolean, true),
  COALESCE(("payload"::jsonb->>'maskCustomerData')::boolean, true),
  COALESCE(("payload"::jsonb->>'autoLockSuspicious')::boolean, false),
  COALESCE(("payload"::jsonb->>'immutableSecurityEvents')::boolean, true),
  CURRENT_TIMESTAMP
FROM "AdminState"
WHERE "key" = 'admin-state:audit:settings' AND jsonb_typeof("payload"::jsonb) = 'object'
ON CONFLICT ("key") DO NOTHING;
