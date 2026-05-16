/*
  Warnings:

  - Added the required column `deliveryEndAt` to the `subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryStartAt` to the `subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequency` to the `subscription` table without a default value. This is not possible if the table is not empty.
*/
-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "daysWeek" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "deliveryEndAt" TEXT NOT NULL,
ADD COLUMN     "deliveryStartAt" TEXT NOT NULL,
ADD COLUMN     "frequency" TEXT NOT NULL,
ALTER COLUMN "serviceDate" SET DEFAULT CURRENT_TIMESTAMP;
