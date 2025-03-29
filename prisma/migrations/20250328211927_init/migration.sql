-- CreateEnum
CREATE TYPE "PlushieStatus" AS ENUM ('PENDING', 'IN_PRODUCTION', 'SHIPPED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PreorderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plushie" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "promptRaw" TEXT NOT NULL,
    "promptSanitized" TEXT NOT NULL,
    "texture" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "creatorId" TEXT NOT NULL,
    "goal" INTEGER NOT NULL DEFAULT 50,
    "minimumGoal" INTEGER NOT NULL DEFAULT 25,
    "pledged" INTEGER NOT NULL DEFAULT 0,
    "status" "PlushieStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Plushie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plushieId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preorder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plushieId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "PreorderStatus" NOT NULL DEFAULT 'PENDING',
    "shippingInfoId" TEXT,
    "billingInfoId" TEXT,
    "paymentIntentId" TEXT,

    CONSTRAINT "Preorder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "plushieId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPlushie" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plushieId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPlushie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingInfo" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "ShippingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInfo" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardToken" TEXT,
    "userId" TEXT,

    CONSTRAINT "BillingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_plushieId_key" ON "Vote"("userId", "plushieId");

-- CreateIndex
CREATE UNIQUE INDEX "Preorder_shippingInfoId_key" ON "Preorder"("shippingInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "Preorder_billingInfoId_key" ON "Preorder"("billingInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "Preorder_paymentIntentId_key" ON "Preorder"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPlushie_userId_plushieId_key" ON "SavedPlushie"("userId", "plushieId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingInfo_userId_key" ON "ShippingInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInfo_userId_key" ON "BillingInfo"("userId");

-- AddForeignKey
ALTER TABLE "Plushie" ADD CONSTRAINT "Plushie_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_plushieId_fkey" FOREIGN KEY ("plushieId") REFERENCES "Plushie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preorder" ADD CONSTRAINT "Preorder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preorder" ADD CONSTRAINT "Preorder_plushieId_fkey" FOREIGN KEY ("plushieId") REFERENCES "Plushie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preorder" ADD CONSTRAINT "Preorder_shippingInfoId_fkey" FOREIGN KEY ("shippingInfoId") REFERENCES "ShippingInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preorder" ADD CONSTRAINT "Preorder_billingInfoId_fkey" FOREIGN KEY ("billingInfoId") REFERENCES "BillingInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preorder" ADD CONSTRAINT "Preorder_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_plushieId_fkey" FOREIGN KEY ("plushieId") REFERENCES "Plushie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlushie" ADD CONSTRAINT "SavedPlushie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlushie" ADD CONSTRAINT "SavedPlushie_plushieId_fkey" FOREIGN KEY ("plushieId") REFERENCES "Plushie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingInfo" ADD CONSTRAINT "ShippingInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInfo" ADD CONSTRAINT "BillingInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
