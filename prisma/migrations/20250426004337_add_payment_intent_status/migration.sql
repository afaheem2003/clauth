/*
  Warnings:

  - The `status` column on the `PaymentIntent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[intentId]` on the table `PaymentIntent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PaymentIntent" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentIntentStatus" NOT NULL DEFAULT 'REQUIRES_CAPTURE';

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_intentId_key" ON "PaymentIntent"("intentId");
