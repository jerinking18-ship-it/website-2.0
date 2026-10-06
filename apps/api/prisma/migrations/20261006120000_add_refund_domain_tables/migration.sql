-- AlterTable
ALTER TABLE "RefundRequest"
ADD COLUMN "customerName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "items" TEXT,
ADD COLUMN "paymentMethodLabel" TEXT,
ADD COLUMN "refundMethod" TEXT,
ADD COLUMN "sla" TEXT,
ADD COLUMN "risk" TEXT,
ADD COLUMN "assignedTo" TEXT,
ADD COLUMN "customerNote" TEXT,
ADD COLUMN "adminNote" TEXT,
ADD COLUMN "evidence" TEXT,
ADD COLUMN "transactionId" TEXT,
ADD COLUMN "financeStatus" TEXT,
ADD COLUMN "gatewayStatus" TEXT,
ADD COLUMN "processedBy" TEXT,
ADD COLUMN "processedTime" TEXT,
ADD COLUMN "returnStatus" TEXT,
ADD COLUMN "reviewerDecision" TEXT,
ADD COLUMN "riskNote" TEXT;

-- CreateTable
CREATE TABLE "RefundReturnPickup" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pickup pending',
    "slot" TEXT,
    "rider" TEXT,
    "address" TEXT,
    "condition" TEXT,
    "restockDecision" TEXT,
    "batch" TEXT,
    "expiry" TEXT,
    "inventoryNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundReturnPickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundApprovalRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "limit" TEXT NOT NULL,
    "evidenceRequired" BOOLEAN NOT NULL DEFAULT false,
    "ownerApproval" BOOLEAN NOT NULL DEFAULT false,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "sla" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundApprovalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "autoApproveLimit" TEXT NOT NULL DEFAULT 'Rs. 0',
    "ownerApprovalLimit" TEXT NOT NULL DEFAULT 'Rs. 0',
    "evidencePolicy" TEXT,
    "walletCredit" BOOLEAN NOT NULL DEFAULT false,
    "returnPickupThreshold" TEXT NOT NULL DEFAULT 'Rs. 0',
    "financeSla" TEXT,
    "customerMessageChannel" TEXT NOT NULL DEFAULT 'WhatsApp',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefundRequest_risk_idx" ON "RefundRequest"("risk");
CREATE INDEX "RefundRequest_financeStatus_idx" ON "RefundRequest"("financeStatus");
CREATE INDEX "RefundReturnPickup_refundId_idx" ON "RefundReturnPickup"("refundId");
CREATE INDEX "RefundReturnPickup_status_idx" ON "RefundReturnPickup"("status");
CREATE INDEX "RefundApprovalRule_status_idx" ON "RefundApprovalRule"("status");
CREATE UNIQUE INDEX "RefundSettings_key_key" ON "RefundSettings"("key");

-- Preserve richer refund request details from the previous admin-state store.
UPDATE "RefundRequest" AS rr
SET
  "customerName" = COALESCE(NULLIF(value->>'customer', ''), rr."customerName"),
  "phone" = COALESCE(NULLIF(value->>'phone', ''), rr."phone"),
  "email" = COALESCE(NULLIF(value->>'email', ''), rr."email"),
  "items" = COALESCE(NULLIF(value->>'items', ''), rr."items"),
  "paymentMethodLabel" = COALESCE(NULLIF(value->>'paymentMethod', ''), rr."paymentMethodLabel"),
  "refundMethod" = COALESCE(NULLIF(value->>'refundMethod', ''), rr."refundMethod"),
  "sla" = COALESCE(NULLIF(value->>'sla', ''), rr."sla"),
  "risk" = COALESCE(NULLIF(value->>'risk', ''), rr."risk"),
  "assignedTo" = COALESCE(NULLIF(value->>'assignedTo', ''), rr."assignedTo"),
  "customerNote" = COALESCE(NULLIF(value->>'customerNote', ''), rr."customerNote"),
  "adminNote" = COALESCE(NULLIF(value->>'adminNote', ''), rr."adminNote"),
  "evidence" = COALESCE(NULLIF(value->>'evidence', ''), rr."evidence"),
  "transactionId" = COALESCE(NULLIF(value->>'transactionId', ''), rr."transactionId"),
  "financeStatus" = COALESCE(NULLIF(value->>'financeStatus', ''), rr."financeStatus"),
  "gatewayStatus" = COALESCE(NULLIF(value->>'gatewayStatus', ''), rr."gatewayStatus"),
  "processedBy" = COALESCE(NULLIF(value->>'processedBy', ''), rr."processedBy"),
  "processedTime" = COALESCE(NULLIF(value->>'processedTime', ''), rr."processedTime"),
  "returnStatus" = COALESCE(NULLIF(value->>'returnStatus', ''), rr."returnStatus"),
  "reviewerDecision" = COALESCE(NULLIF(value->>'reviewerDecision', ''), rr."reviewerDecision"),
  "riskNote" = COALESCE(NULLIF(value->>'riskNote', ''), rr."riskNote")
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "AdminState"."key" = 'admin-state:refunds:requests'
  AND rr."id" = value->>'id';

INSERT INTO "RefundReturnPickup" ("id", "refundId", "orderId", "customer", "items", "status", "slot", "rider", "address", "condition", "restockDecision", "batch", "expiry", "inventoryNote", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'RET-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'refundId', ''), '-'),
  COALESCE(NULLIF(value->>'orderId', ''), '-'),
  COALESCE(NULLIF(value->>'customer', ''), 'Customer'),
  COALESCE(NULLIF(value->>'items', ''), 'Items not recorded'),
  COALESCE(NULLIF(value->>'status', ''), 'Pickup pending'),
  NULLIF(value->>'slot', ''),
  NULLIF(value->>'rider', ''),
  NULLIF(value->>'address', ''),
  NULLIF(value->>'condition', ''),
  NULLIF(value->>'restockDecision', ''),
  NULLIF(value->>'batch', ''),
  NULLIF(value->>'expiry', ''),
  NULLIF(value->>'inventoryNote', ''),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:refunds:returns'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RefundApprovalRule" ("id", "name", "trigger", "limit", "evidenceRequired", "ownerApproval", "autoApprove", "sla", "status", "updatedAt")
SELECT
  COALESCE(NULLIF(value->>'id', ''), 'RR-' || md5(random()::text || clock_timestamp()::text)),
  COALESCE(NULLIF(value->>'name', ''), 'Refund rule'),
  COALESCE(NULLIF(value->>'trigger', ''), 'Manual review'),
  COALESCE(NULLIF(value->>'limit', ''), 'Rs. 0'),
  CASE WHEN lower(COALESCE(value->>'evidenceRequired', 'false')) IN ('true', 'on', '1', 'yes') THEN true ELSE false END,
  CASE WHEN lower(COALESCE(value->>'ownerApproval', 'false')) IN ('true', 'on', '1', 'yes') THEN true ELSE false END,
  CASE WHEN lower(COALESCE(value->>'autoApprove', 'false')) IN ('true', 'on', '1', 'yes') THEN true ELSE false END,
  NULLIF(value->>'sla', ''),
  COALESCE(NULLIF(value->>'status', ''), 'Active'),
  CURRENT_TIMESTAMP
FROM "AdminState", jsonb_array_elements(CASE WHEN jsonb_typeof("payload"::jsonb) = 'array' THEN "payload"::jsonb ELSE '[]'::jsonb END) AS value
WHERE "key" = 'admin-state:refunds:rules'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RefundSettings" ("id", "key", "autoApproveLimit", "ownerApprovalLimit", "evidencePolicy", "walletCredit", "returnPickupThreshold", "financeSla", "customerMessageChannel", "updatedAt")
SELECT
  'refund-settings-default',
  'default',
  COALESCE(NULLIF("payload"::jsonb->>'autoApproveLimit', ''), 'Rs. 0'),
  COALESCE(NULLIF("payload"::jsonb->>'ownerApprovalLimit', ''), 'Rs. 0'),
  NULLIF("payload"::jsonb->>'evidencePolicy', ''),
  CASE WHEN lower(COALESCE("payload"::jsonb->>'walletCredit', 'false')) IN ('true', 'on', '1', 'yes') THEN true ELSE false END,
  COALESCE(NULLIF("payload"::jsonb->>'returnPickupThreshold', ''), 'Rs. 0'),
  NULLIF("payload"::jsonb->>'financeSla', ''),
  COALESCE(NULLIF("payload"::jsonb->>'customerMessageChannel', ''), 'WhatsApp'),
  CURRENT_TIMESTAMP
FROM "AdminState"
WHERE "key" = 'admin-state:refunds:settings' AND jsonb_typeof("payload"::jsonb) = 'object'
ON CONFLICT ("key") DO NOTHING;
