/*
  Warnings:

  - You are about to drop the column `editTypeId` on the `Log` table. All the data in the column will be lost.
  - Added the required column `logMethodId` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logTypeId` to the `Log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Log" DROP COLUMN "editTypeId",
ADD COLUMN     "logMethodId" INTEGER NOT NULL,
ADD COLUMN     "logTypeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_logTypeId_fkey" FOREIGN KEY ("logTypeId") REFERENCES "LogType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_logMethodId_fkey" FOREIGN KEY ("logMethodId") REFERENCES "LogMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
