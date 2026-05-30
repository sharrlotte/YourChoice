-- Drop redundant single-column index, composite (projectId, status, index) covers it
DROP INDEX IF EXISTS "Task_projectId_status_idx";

-- Create index on Task.index for ORDER BY and re-index window function
CREATE INDEX IF NOT EXISTS "Task_index_idx" ON "Task"("index");

-- Create composite covering index for the most common query pattern
CREATE INDEX IF NOT EXISTS "Task_projectId_status_index_idx" ON "Task"("projectId", "status", "index");

-- Create index on Vote.taskId for vote count joins
CREATE INDEX IF NOT EXISTS "Vote_taskId_idx" ON "Vote"("taskId");

-- Create index on Comment.taskId for comment list joins
CREATE INDEX IF NOT EXISTS "Comment_taskId_idx" ON "Comment"("taskId");

-- Create index on Label.projectId for label list queries
CREATE INDEX IF NOT EXISTS "Label_projectId_idx" ON "Label"("projectId");
