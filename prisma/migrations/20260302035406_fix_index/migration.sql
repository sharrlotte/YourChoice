-- DropIndex
DROP INDEX "Task_projectId_status_index_idx";

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");
