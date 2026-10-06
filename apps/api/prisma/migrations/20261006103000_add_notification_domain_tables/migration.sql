-- CreateTable
CREATE TABLE "NotificationFailure" (
    "id" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "reason" TEXT NOT NULL,
    "time" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationFailure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "template" TEXT NOT NULL,
    "delay" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TEXT,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "message" TEXT NOT NULL,
    "variables" TEXT,
    "cta" TEXT,
    "lastUsed" TEXT,
    "performance" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "notificationJobId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationFailure_status_idx" ON "NotificationFailure"("status");

-- CreateIndex
CREATE INDEX "NotificationFailure_channel_idx" ON "NotificationFailure"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationAutomationRule_name_key" ON "NotificationAutomationRule"("name");

-- CreateIndex
CREATE INDEX "NotificationAutomationRule_active_idx" ON "NotificationAutomationRule"("active");

-- CreateIndex
CREATE INDEX "NotificationAutomationRule_channel_idx" ON "NotificationAutomationRule"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_name_key" ON "NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "NotificationTemplate_channel_idx" ON "NotificationTemplate"("channel");

-- CreateIndex
CREATE INDEX "NotificationTemplate_active_idx" ON "NotificationTemplate"("active");

-- CreateIndex
CREATE INDEX "NotificationDeliveryAttempt_notificationJobId_idx" ON "NotificationDeliveryAttempt"("notificationJobId");

-- CreateIndex
CREATE INDEX "NotificationDeliveryAttempt_status_idx" ON "NotificationDeliveryAttempt"("status");

-- CreateIndex
CREATE INDEX "NotificationDeliveryAttempt_channel_idx" ON "NotificationDeliveryAttempt"("channel");

-- Preserve existing saved notification failures.
INSERT INTO "NotificationFailure" ("id", "customer", "channel", "reason", "time", "status", "createdAt", "updatedAt")
SELECT
  value->>'id',
  COALESCE(value->>'customer', 'Customer'),
  CASE
    WHEN value->>'channel' = 'Email' THEN 'EMAIL'::"NotificationChannel"
    WHEN value->>'channel' = 'SMS' THEN 'SMS'::"NotificationChannel"
    WHEN value->>'channel' = 'Push' THEN 'IN_APP'::"NotificationChannel"
    WHEN value->>'channel' = 'In-app' THEN 'IN_APP'::"NotificationChannel"
    ELSE 'WHATSAPP'::"NotificationChannel"
  END,
  COALESCE(value->>'reason', 'Delivery failed'),
  value->>'time',
  COALESCE(value->>'status', 'Open'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements("payload") AS value
WHERE "key" = 'admin-state:notifications:failures' AND value ? 'id'
ON CONFLICT ("id") DO NOTHING;

-- Preserve existing saved automation rules.
INSERT INTO "NotificationAutomationRule" ("id", "name", "trigger", "channel", "template", "delay", "active", "lastRun", "failures", "createdAt", "updatedAt")
SELECT
  COALESCE(value->>'id', value->>'name'),
  COALESCE(value->>'name', 'Automation rule'),
  COALESCE(value->>'trigger', 'Manual trigger'),
  CASE
    WHEN value->>'channel' = 'Email' THEN 'EMAIL'::"NotificationChannel"
    WHEN value->>'channel' = 'SMS' THEN 'SMS'::"NotificationChannel"
    WHEN value->>'channel' = 'Push' THEN 'IN_APP'::"NotificationChannel"
    WHEN value->>'channel' = 'In-app' THEN 'IN_APP'::"NotificationChannel"
    ELSE 'WHATSAPP'::"NotificationChannel"
  END,
  COALESCE(value->>'template', 'Template'),
  COALESCE(value->>'delay', 'Immediate'),
  COALESCE((value->>'active')::BOOLEAN, true),
  value->>'lastRun',
  COALESCE((value->>'failures')::INTEGER, 0),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements("payload") AS value
WHERE "key" = 'admin-state:notifications:automation-rules' AND value ? 'name'
ON CONFLICT ("name") DO NOTHING;
