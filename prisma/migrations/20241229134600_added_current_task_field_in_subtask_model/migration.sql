/*
  Warnings:

  - You are about to drop the column `userId` on the `Subtask` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Subtask" DROP CONSTRAINT "Subtask_userId_fkey";

-- AlterTable
ALTER TABLE "Subtask" DROP COLUMN "userId",
ADD COLUMN     "assignedToId" INTEGER,
ADD COLUMN     "currentTask" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
