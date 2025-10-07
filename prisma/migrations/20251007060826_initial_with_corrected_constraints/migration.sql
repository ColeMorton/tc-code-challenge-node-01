-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bill_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bill_reference" TEXT NOT NULL,
    "bill_date" DATETIME NOT NULL,
    "submitted_at" DATETIME,
    "approved_at" DATETIME,
    "on_hold_at" DATETIME,
    "bill_stage_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bills_bill_stage_id_fkey" FOREIGN KEY ("bill_stage_id") REFERENCES "bill_stages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bills_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bill_stages_label_key" ON "bill_stages"("label");

-- CreateIndex
CREATE INDEX "bill_stages_label_idx" ON "bill_stages"("label");

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_reference_key" ON "bills"("bill_reference");

-- CreateIndex
CREATE INDEX "bills_bill_stage_id_idx" ON "bills"("bill_stage_id");

-- CreateIndex
CREATE INDEX "bills_assigned_to_id_idx" ON "bills"("assigned_to_id");

-- CreateIndex
CREATE INDEX "bills_bill_reference_idx" ON "bills"("bill_reference");

-- CreateIndex
CREATE INDEX "bills_bill_date_idx" ON "bills"("bill_date");

-- CreateIndex
CREATE INDEX "bills_bill_stage_id_assigned_to_id_idx" ON "bills"("bill_stage_id", "assigned_to_id");
