/*
  Warnings:

  - Added the required column `accessories` to the `Plushie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color` to the `Plushie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outfit` to the `Plushie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pose` to the `Plushie` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Plushie" ADD COLUMN     "accessories" TEXT NOT NULL,
ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "outfit" TEXT NOT NULL,
ADD COLUMN     "pose" TEXT NOT NULL;
