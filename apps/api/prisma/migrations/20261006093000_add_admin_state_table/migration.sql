-- CreateTable
CREATE TABLE "AdminState" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminState_key_key" ON "AdminState"("key");

-- Preserve previously saved generic admin state records that were stored in HomepageSection.
INSERT INTO "AdminState" ("id", "key", "payload", "createdAt", "updatedAt")
SELECT "id", "key", "payload", "createdAt", "updatedAt"
FROM "HomepageSection"
WHERE "key" LIKE 'admin-state:%'
ON CONFLICT ("key") DO NOTHING;
