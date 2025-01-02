-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_workId_fkey";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
