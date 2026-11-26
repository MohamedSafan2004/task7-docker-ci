/*
  Warnings:

  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_proudctId_fkey";

-- DropTable
DROP TABLE "OrderItem";

-- CreateTable
CREATE TABLE "orderIteam" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "orderIteam_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orderIteam" ADD CONSTRAINT "orderIteam_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderIteam" ADD CONSTRAINT "orderIteam_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
