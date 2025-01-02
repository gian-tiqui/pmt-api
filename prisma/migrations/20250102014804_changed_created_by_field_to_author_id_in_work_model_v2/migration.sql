/*
  Warnings:

  - You are about to drop the column `createdById` on the `Work` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Work` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Work" DROP CONSTRAINT "Work_createdById_fkey";

-- AlterTable
ALTER TABLE "Work" DROP COLUMN "createdById",
ADD COLUMN     "authorId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
