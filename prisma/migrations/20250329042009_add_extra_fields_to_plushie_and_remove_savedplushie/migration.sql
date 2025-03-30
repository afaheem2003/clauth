/*
  Warnings:

  - You are about to drop the `SavedPlushie` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SavedPlushie" DROP CONSTRAINT "SavedPlushie_plushieId_fkey";

-- DropForeignKey
ALTER TABLE "SavedPlushie" DROP CONSTRAINT "SavedPlushie_userId_fkey";

-- DropTable
DROP TABLE "SavedPlushie";
