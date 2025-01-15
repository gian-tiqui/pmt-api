/*
  Warnings:

  - You are about to drop the `DepartmentDivision` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `divisionId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Mention` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DepartmentDivision" DROP CONSTRAINT "DepartmentDivision_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentDivision" DROP CONSTRAINT "DepartmentDivision_divisionId_fkey";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "divisionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Mention" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "DepartmentDivision";

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
