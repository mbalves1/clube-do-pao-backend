-- AlterTable
ALTER TABLE "User" ADD COLUMN     "supabaseUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "bakeries" ADD COLUMN     "supabaseUserId" TEXT;

-- AlterTable
ALTER TABLE "delivery_people" ADD COLUMN     "supabaseUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "bakeries_supabaseUserId_key" ON "bakeries"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_people_supabaseUserId_key" ON "delivery_people"("supabaseUserId");

