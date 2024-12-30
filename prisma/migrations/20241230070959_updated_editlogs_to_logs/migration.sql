/*
  Warnings:

  - You are about to drop the `EditLogs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EditType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EditLogs" DROP CONSTRAINT "EditLogs_editedBy_fkey";

-- DropTable
DROP TABLE "EditLogs";

-- DropTable
DROP TABLE "EditType";

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "editedBy" INTEGER NOT NULL,
    "editTypeId" INTEGER NOT NULL,
    "logs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogType" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogMethod" (
    "id" SERIAL NOT NULL,
    "method" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LogType_type_key" ON "LogType"("type");

-- CreateIndex
CREATE UNIQUE INDEX "LogMethod_method_key" ON "LogMethod"("method");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
