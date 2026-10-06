-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- Preserve existing settings saved before this domain table existed.
INSERT INTO "SystemSetting" ("id", "key", "payload", "createdAt", "updatedAt")
SELECT "id", "key", "payload", "createdAt", "updatedAt"
FROM "AdminState"
WHERE "key" LIKE 'admin-state:settings:%'
ON CONFLICT ("key") DO NOTHING;
