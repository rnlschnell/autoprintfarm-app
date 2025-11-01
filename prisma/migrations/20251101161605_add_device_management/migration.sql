-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Device_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedDeviceId" TEXT,
    "orderData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" DATETIME,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_assignedDeviceId_fkey" FOREIGN KEY ("assignedDeviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_shopDomain_key" ON "Tenant"("shopDomain");

-- CreateIndex
CREATE INDEX "Device_tenantId_idx" ON "Device"("tenantId");

-- CreateIndex
CREATE INDEX "Device_apiKeyHash_idx" ON "Device"("apiKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "Order_shopifyOrderId_key" ON "Order"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "Order_tenantId_status_idx" ON "Order"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Order_assignedDeviceId_idx" ON "Order"("assignedDeviceId");

-- CreateIndex
CREATE INDEX "Order_shopifyOrderId_idx" ON "Order"("shopifyOrderId");
