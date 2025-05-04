-- AlterTable
ALTER TABLE "PaymentIntent" ADD COLUMN     "address1" TEXT,
ADD COLUMN     "address2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zip" TEXT;
