"use client";

import { updateTaskStatus } from "@/app/actions/tasks";
import { KanbanColumn } from "@/components/board/KanbanColumn";
import { TaskStatus } from "@prisma/client";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createPortal } from "react-dom";
import { TaskCard } from "./TaskCard";
import { TaskDetails } from "./TaskDetails";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const columns: { status: TaskStatus; title: string }[] = [
	{ status: "PENDING_SUGGESTION", title: "Pending Suggestion" },
	{ status: "ACCEPTED", title: "Accepted" },
	{ status: "REJECTED", title: "Rejected" },
	{ status: "IN_PROGRESS", title: "In Progress" },
	{ status: "COMPLETED", title: "Completed" },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
	const queryClient = useQueryClient();
	const [activeTask, setActiveTask] = useState<any>(null);
	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<"index" | "votes">("index");

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	const updateStatusMutation = useMutation({
		mutationFn: async ({ taskId, status, index }: { taskId: string; status: TaskStatus; index: number }) => {
			await updateTaskStatus(taskId, status, index);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
		},
	});

	const handleDragStart = (event: any) => {
		setActiveTask(event.active.data.current?.task);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over) {
			setActiveTask(null);
			return;
		}

		const taskId = active.id as string;
		const overId = over.id;

		// Determine target column and index
		let targetStatus: TaskStatus;
		let targetIndex: number;

		// Check if dropped on a column (empty area) or on a task
		const isOverColumn = columns.some((col) => col.status === overId);

		if (isOverColumn) {
			targetStatus = overId as TaskStatus;
			targetIndex = 0; // Or last? Usually if dropped on column, append to end or start. Let's say 0.
			// Ideally we should calculate based on position but simple drop on column -> index 0 or length.
			// If we want accurate index, we need to know where in the list we dropped.
			// But dnd-kit gives `over` as the container if we use `useDroppable` on container.
			// If we drop on a task, `over.id` is task id.
		} else {
			// Dropped on a task
			// We need to find the task to get its status and index
			// But we don't have all tasks in memory easily available here without iterating cache.
			// We can get data from `over.data.current?.task`.
			const overTask = over.data.current?.task;
			if (overTask) {
				targetStatus = overTask.status;
				targetIndex = overTask.index; // Insert before or after?
				// Usually we check if active.rect.top > over.rect.top
				// For simplicity, let's say we insert at the index of the task we dropped on.
			} else {
				// Fallback
				setActiveTask(null);
				return;
			}
		}

		if (activeTask && (activeTask.status !== targetStatus || activeTask.index !== targetIndex)) {
			updateStatusMutation.mutate({ taskId, status: targetStatus, index: targetIndex });
		}

		setActiveTask(null);
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex justify-end px-4 py-2 bg-muted/20 border-b">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span>Sort by:</span>
					<Select value={sortBy} onValueChange={(value) => setSortBy(value as "index" | "votes")}>
						<SelectTrigger className="w-[140px] h-8">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="index">Manual Order</SelectItem>
							<SelectItem value="votes">Most Votes</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<DndContext
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				// Disable drag if sorting by votes?
				// We can check inside handleDragStart or handleDragEnd, or just disable sensors.
				// Or make items not draggable.
			>
				<div className="flex h-full gap-4 overflow-x-auto p-4">
					{columns.map((col) => (
						<KanbanColumn
							key={col.status}
							projectId={projectId}
							status={col.status}
							title={col.title}
							onTaskClick={(taskId) => setSelectedTaskId(taskId)}
							sortBy={sortBy}
						/>
					))}
				</div>

				{createPortal(<DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>, document.body)}

				{selectedTaskId && <TaskDetails taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
			</DndContext>
		</div>
	);
}
