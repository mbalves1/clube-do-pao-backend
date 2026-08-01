-- DropIndex
DROP INDEX "delivery_people_supabaseUserId_key";

-- AlterTable
ALTER TABLE "delivery_people" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "supabaseUserId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "bakery_people" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bakeryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bakery_people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bakery_people_userId_key" ON "bakery_people"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_people_userId_key" ON "delivery_people"("userId");

-- AddForeignKey
ALTER TABLE "bakery_people" ADD CONSTRAINT "bakery_people_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bakery_people" ADD CONSTRAINT "bakery_people_bakeryId_fkey" FOREIGN KEY ("bakeryId") REFERENCES "bakeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_people" ADD CONSTRAINT "delivery_people_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
