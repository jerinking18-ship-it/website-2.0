-- CreateTable
CREATE TABLE "FinanceCodCollection" (
    "id" TEXT NOT NULL,
    "rider" TEXT NOT NULL,
    "phone" TEXT,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "collected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "submitted" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "difference" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending collection',
    "settlementTime" TEXT,
    "proof" TEXT NOT NULL DEFAULT 'Missing',
    "owner" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceCodCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceSettlement" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "batchDate" TEXT,
    "expectedDate" TEXT,
    "gross" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "charges" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "received" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "difference" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "bankReference" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceExpense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL,
    "paidDate" TEXT,
    "dueDate" TEXT,
    "receipt" TEXT NOT NULL DEFAULT 'Missing',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceInvoice" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Generated',
    "downloadUrl" TEXT,
    "sentStatus" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceReportExport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Processing',
    "dateRange" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTaxSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "gstCollected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxableSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "exemptSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hsnSummary" TEXT,
    "invoiceCount" TEXT NOT NULL DEFAULT '0',
    "creditNoteCount" TEXT NOT NULL DEFAULT '0',
    "reviewOwner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceTaxSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceCodCollection_status_idx" ON "FinanceCodCollection"("status");

-- CreateIndex
CREATE INDEX "FinanceSettlement_status_idx" ON "FinanceSettlement"("status");

-- CreateIndex
CREATE INDEX "FinanceExpense_status_idx" ON "FinanceExpense"("status");

-- CreateIndex
CREATE INDEX "FinanceInvoice_status_idx" ON "FinanceInvoice"("status");

-- CreateIndex
CREATE INDEX "FinanceReportExport_status_idx" ON "FinanceReportExport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceTaxSettings_key_key" ON "FinanceTaxSettings"("key");
