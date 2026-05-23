-- CreateEnum
CREATE TYPE "DeliveryModal" AS ENUM ('BIKE', 'MOTORCYCLE', 'WALKING');

-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "deliveryPersonId" TEXT;

-- CreateTable
CREATE TABLE "delivery_people" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "phone" TEXT,
    "modal" "DeliveryModal" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_people_document_key" ON "delivery_people"("document");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_deliveryPersonId_fkey" FOREIGN KEY ("deliveryPersonId") REFERENCES "delivery_people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
