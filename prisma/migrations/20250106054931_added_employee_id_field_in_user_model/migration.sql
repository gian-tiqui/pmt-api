/*
  Warnings:

  - A unique constraint covering the columns `[employeeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "employeeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "DepartmentDivision" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "divisionId" INTEGER NOT NULL,

    CONSTRAINT "DepartmentDivision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- AddForeignKey
ALTER TABLE "DepartmentDivision" ADD CONSTRAINT "DepartmentDivision_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentDivision" ADD CONSTRAINT "DepartmentDivision_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
