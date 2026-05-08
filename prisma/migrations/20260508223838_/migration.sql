-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "bakeries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "serviceStartAt" TEXT NOT NULL,
    "serviceEndAt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bakeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteBakery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bakeryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteBakery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bakeryId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "serviceStartAt" TEXT NOT NULL,
    "serviceEndAt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bakeries_email_key" ON "bakeries"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteBakery_userId_bakeryId_key" ON "FavoriteBakery"("userId", "bakeryId");

-- AddForeignKey
ALTER TABLE "FavoriteBakery" ADD CONSTRAINT "FavoriteBakery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteBakery" ADD CONSTRAINT "FavoriteBakery_bakeryId_fkey" FOREIGN KEY ("bakeryId") REFERENCES "bakeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_bakeryId_fkey" FOREIGN KEY ("bakeryId") REFERENCES "bakeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
