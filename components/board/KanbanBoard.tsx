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
import { toast } from "sonner";

const columns: { status: TaskStatus; title: string }[] = [
	{ status: "PENDING_SUGGESTION", title: "Pending Suggestion" },
	{ status: "ACCEPTED", title: "Accepted" },
	{ status: "REJECTED", title: "Rejected" },
	{ status: "IN_PROGRESS", title: "In Progress" },
	{ status: "COMPLETED", title: "Completed" },
];

export function KanbanBoard({ projectId, canManageLabels }: { projectId: string; canManageLabels?: boolean }) {
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
		mutationFn: async ({
			taskId,
			status,
			index,
			overTaskId,
		}: {
			taskId: string;
			status: TaskStatus;
			index: number;
			overTaskId?: string;
		}) => {
			await updateTaskStatus(taskId, status, index);
		},
		onMutate: async ({ taskId, status, index, overTaskId }) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

			const previousTasks = queryClient.getQueriesData({ queryKey: ["tasks", projectId] });

			// Find and remove task from source
			let movedTask: any = null;

			queryClient.setQueriesData({ queryKey: ["tasks", projectId] }, (oldData: any) => {
				if (!oldData || !oldData.pages) return oldData;

				const newPages = oldData.pages.map((page: any[]) => {
					const found = page.find((t) => t.id === taskId);
					if (found) {
						movedTask = found;
						return page.filter((t) => t.id !== taskId);
					}
					return page;
				});

				return { ...oldData, pages: newPages };
			});

			// Add to destination
			if (movedTask) {
				const updatedTask = { ...movedTask, status: status, index: index };

				queryClient.setQueryData(["tasks", projectId, status, "index"], (oldData: any) => {
					if (!oldData) {
						return { pages: [[updatedTask]], pageParams: [1] };
					}

					const newPages = [...oldData.pages];
					if (newPages.length === 0) {
						newPages.push([updatedTask]);
						return { ...oldData, pages: newPages };
					}

					// If we have an overTaskId, try to insert relative to it
					if (overTaskId) {
						let inserted = false;
						for (let i = 0; i < newPages.length; i++) {
							const page = newPages[i];
							const overIndex = page.findIndex((t: any) => t.id === overTaskId);
							if (overIndex !== -1) {
								// Found the page with the overTask
								const newPage = [...page];

								// Determine if we insert before or after
								// Since we are sorting by index ASC (low to high)
								// If we dropped ON a task, dnd-kit logic usually implies we want to take its place.
								// If moving DOWN (higher index), we insert AFTER.
								// If moving UP (lower index), we insert BEFORE.
								// But here we only know overTaskId.
								// We can check indices.
								const overTask = page[overIndex];

								// Heuristic: If we are in the same column, we can compare old index.
								// If different column, we usually insert BEFORE (taking the spot).

								if (movedTask.status === status && movedTask.index < overTask.index) {
									// Moving down in same column -> Insert AFTER
									newPage.splice(overIndex + 1, 0, updatedTask);
								} else {
									// Moving up or changing column -> Insert BEFORE
									newPage.splice(overIndex, 0, updatedTask);
								}

								newPages[i] = newPage;
								inserted = true;
								break;
							}
						}

						if (!inserted) {
							// Fallback: Add to start of first page
							newPages[0] = [updatedTask, ...newPages[0]];
						}
					} else {
						// No overTaskId (dropped on column or empty space), add to start
						newPages[0] = [updatedTask, ...newPages[0]];
					}

					return { ...oldData, pages: newPages };
				});
			}

			return { previousTasks };
		},
		onError: (err, newTodo, context) => {
			if (context?.previousTasks) {
				context.previousTasks.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
			toast.error("Failed to move task");
		},
		onSettled: () => {
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
		let overTaskId: string | undefined;

		// Check if dropped on a column (empty area) or on a task
		const isOverColumn = columns.some((col) => col.status === overId);

		if (isOverColumn) {
			targetStatus = overId as TaskStatus;
			targetIndex = 0;
		} else {
			// Dropped on a task
			const overTask = over.data.current?.task;
			if (overTask) {
				targetStatus = overTask.status;
				targetIndex = overTask.index;
				overTaskId = overTask.id;
			} else {
				// Fallback
				setActiveTask(null);
				return;
			}
		}

		if (activeTask && (activeTask.status !== targetStatus || activeTask.index !== targetIndex)) {
			updateStatusMutation.mutate({ taskId, status: targetStatus, index: targetIndex, overTaskId });
		}

		setActiveTask(null);
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex justify-end py-2 bg-muted/20 border-b">
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
				<div className="flex h-full gap-4 overflow-x-auto py-4">
					{columns.map((col) => (
						<KanbanColumn
							key={col.status}
							projectId={projectId}
							status={col.status}
							title={col.title}
							onTaskClick={(taskId) => setSelectedTaskId(taskId)}
							sortBy={sortBy}
							canManageLabels={canManageLabels}
						/>
					))}
				</div>

				{createPortal(<DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>, document.body)}

				{selectedTaskId && <TaskDetails taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
			</DndContext>
		</div>
	);
}
