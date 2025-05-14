-- DropForeignKey
ALTER TABLE "Preorder" DROP CONSTRAINT "Preorder_userId_fkey";

-- AlterTable
ALTER TABLE "Preorder" ADD COLUMN     "guestEmail" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Preorder" ADD CONSTRAINT "Preorder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
