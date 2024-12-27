/*
  Warnings:

  - Added the required column `createdAt` to the `DeadlineExtensions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DeadlineExtensions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeadlineExtensions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "EditLogs" (
    "id" SERIAL NOT NULL,
    "editedBy" INTEGER NOT NULL,
    "editTypeId" INTEGER NOT NULL,
    "logs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditType" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditType_type_key" ON "EditType"("type");

-- AddForeignKey
ALTER TABLE "EditLogs" ADD CONSTRAINT "EditLogs_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
