/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerLinkId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "providerLinkId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerOrderId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_provider_providerOrderId_idx" ON "Payment"("provider", "providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_provider_providerLinkId_key" ON "Payment"("provider", "providerLinkId");
