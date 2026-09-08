-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');

-- AlterEnum
-- Insert the two seller states in their logical position (between PENDING and
-- ACCEPTED) so the physical enum order matches the declaration order in
-- schema.prisma and Prisma sees no drift on the next introspection/diff.
ALTER TYPE "OrderStatus" ADD VALUE 'PREPARING' BEFORE 'ACCEPTED';
ALTER TYPE "OrderStatus" ADD VALUE 'READY' BEFORE 'ACCEPTED';

-- AlterTable: additive columns on "orders".
-- "bakeryId" is added NULLABLE first, backfilled from the parent subscription row,
-- then set NOT NULL — so this migration is safe on a populated "orders" table
-- (task_02 handles generating any missing Order rows, not this migration).
ALTER TABLE "orders" ADD COLUMN     "bakeryId" TEXT,
ADD COLUMN     "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "preparingAt" TIMESTAMP(3),
ADD COLUMN     "readyAt" TIMESTAMP(3);

UPDATE "orders" AS o
SET "bakeryId" = s."bakeryId"
FROM "subscription" AS s
WHERE s."id" = o."subscriptionId";

ALTER TABLE "orders" ALTER COLUMN "bakeryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'DELIVERY';

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "priceCentsSnapshot" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_items" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "subscription_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_items_subscriptionId_itemId_key" ON "subscription_items"("subscriptionId", "itemId");

-- CreateIndex
-- Idempotency key for order generation (task_09). Assumes at most one Order per
-- (subscription, serviceDate); production has effectively no pre-existing Order
-- rows. If a dev DB has duplicates, dedupe before applying.
CREATE UNIQUE INDEX "orders_subscriptionId_serviceDate_key" ON "orders"("subscriptionId", "serviceDate");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_bakeryId_fkey" FOREIGN KEY ("bakeryId") REFERENCES "bakeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
