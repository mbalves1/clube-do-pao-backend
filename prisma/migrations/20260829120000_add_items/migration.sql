-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "bakeryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_bakeryId_fkey" FOREIGN KEY ("bakeryId") REFERENCES "bakeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
