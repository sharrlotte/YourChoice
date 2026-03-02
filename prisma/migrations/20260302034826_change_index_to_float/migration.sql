-- DropIndex
DROP INDEX "Task_projectId_status_idx";

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "index" SET DEFAULT 0,
ALTER COLUMN "index" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Task_projectId_status_index_idx" ON "Task"("projectId", "status", "index");
