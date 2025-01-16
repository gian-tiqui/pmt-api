/*
  Warnings:

  - You are about to drop the `DeadlineExtensions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DeadlineExtensions" DROP CONSTRAINT "DeadlineExtensions_extendedBy_fkey";

-- DropTable
DROP TABLE "DeadlineExtensions";
