-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('REQUIRES_CAPTURE', 'SUCCEEDED', 'FAILED');

-- AlterEnum
ALTER TYPE "PreorderStatus" ADD VALUE 'COLLECTED';
