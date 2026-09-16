"use client";

import { updateTaskStatus } from "@/app/actions/tasks";
import { KanbanColumn } from "@/components/board/KanbanColumn";
import type { TaskStatus, TaskWithRelations } from "@/types";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { TaskCard } from "./TaskCard";
import { TaskDetails } from "./TaskDetails";
import { useQueryState } from "nuqs";

const columns: { status: TaskStatus; title: string }[] = [
	{ status: "PENDING_SUGGESTION", title: "Pending Suggestion" },
	{ status: "ACCEPTED", title: "Accepted" },
	{ status: "IN_PROGRESS", title: "In Progress" },
	{ status: "COMPLETED", title: "Completed" },
	{ status: "REJECTED", title: "Rejected" },
];

export function KanbanBoard({ projectId, canManageLabels }: { projectId: string; canManageLabels?: boolean }) {
	const queryClient = useQueryClient();
	const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
	const [selectedTaskId, setSelectedTaskId] = useQueryState("taskId");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

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
		onMutate: async ({ taskId, status, index }) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

			const previousTasks = queryClient.getQueriesData<InfiniteData<TaskWithRelations[]>>({ queryKey: ["tasks", projectId] });

			let movedTask: TaskWithRelations | null = null;

			queryClient.setQueriesData<InfiniteData<TaskWithRelations[]>>({ queryKey: ["tasks", projectId] }, (oldData) => {
				if (!oldData || !Array.isArray(oldData.pages)) return oldData;

				const newPages = oldData.pages.map((page) => {
					if (!Array.isArray(page)) return page;
					const found = page.find((t) => t?.id === taskId);
					if (found) movedTask = found;
					return page.filter((t) => t?.id !== taskId);
				});

				return { ...oldData, pages: newPages };
			});

			const taskToMove: TaskWithRelations | null = movedTask;
			if (taskToMove) {
				const updatedTask: TaskWithRelations = { ...taskToMove, status, index };

				queryClient.setQueryData<InfiniteData<TaskWithRelations[]>>(["tasks", projectId, status, "index"], (oldData) => {
					if (!oldData || !Array.isArray(oldData.pages) || oldData.pages.length === 0) {
						return { pages: [[updatedTask]], pageParams: [1] };
					}

					const existingTasks = oldData.pages
						.flatMap((page) => (Array.isArray(page) ? page : []))
						.filter((t) => t?.id !== taskId && Boolean(t));

					const allTasks = [...existingTasks, updatedTask].sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0));

					const pageSizes = oldData.pages.map((p) => (Array.isArray(p) ? p.length : 10));
					let offset = 0;
					const newPages = pageSizes.map((size: number, idx: number) => {
						const count = idx === pageSizes.length - 1 ? allTasks.length - offset : Math.max(1, size);
						const slice = allTasks.slice(offset, offset + count);
						offset += count;
						return slice;
					});

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

	const handleDragStart = (event: DragStartEvent) => {
		const task = event.active.data.current?.task as TaskWithRelations | undefined;
		if (task) {
			setActiveTask(task);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveTask(null);

		if (!over) {
			toast.warning("Please drop the task in a column");
			return;
		}

		const activeTask = active.data.current?.task as TaskWithRelations | undefined;
		if (!activeTask) {
			toast.warning("No active task to move");
			return;
		}

		const activeId = String(active.id);
		const overId = String(over.id);

		let newStatus: TaskStatus = activeTask.status;

		const isOverColumn = columns.some((col) => col.status === overId);

		if (isOverColumn) {
			newStatus = overId as TaskStatus;
		} else {
			const overTask = over.data.current?.task as TaskWithRelations | undefined;
			if (overTask?.status) {
				newStatus = overTask.status;
			} else {
				// Fallback: search query cache to identify which column contains overId
				for (const col of columns) {
					const colData = queryClient.getQueryData<InfiniteData<TaskWithRelations[]>>(["tasks", projectId, col.status, "index"]);
					const colTasks = colData?.pages?.flatMap((p) => (Array.isArray(p) ? p : [])) || [];
					if (colTasks.some((t) => t?.id === overId)) {
						newStatus = col.status;
						break;
					}
				}
			}
		}

		// Retrieve tasks for destination column from query cache
		const queryKey = ["tasks", projectId, newStatus, "index"];
		const data = queryClient.getQueryData<InfiniteData<TaskWithRelations[]>>(queryKey);
		const rawTasks = data?.pages?.flatMap((p) => (Array.isArray(p) ? p : []))?.filter(Boolean) || [];
		const tasks: TaskWithRelations[] = Array.from(new Map(rawTasks.map((t) => [t.id, t])).values());

		let newIndex = activeTask.index;

		if (activeTask.status !== newStatus) {
			if (isOverColumn) {
				const lastItem = tasks[tasks.length - 1];
				newIndex = lastItem && typeof lastItem.index === "number" ? lastItem.index + 1000 : 1000;
			} else {
				const overTaskIndex = tasks.findIndex((t) => t.id === overId);
				if (overTaskIndex >= 0) {
					const prev = tasks[overTaskIndex - 1];
					const curr = tasks[overTaskIndex];
					if (!prev) {
						newIndex = curr && typeof curr.index === "number" ? (curr.index > 0 ? curr.index / 2 : curr.index - 1000) : 1000;
					} else {
						const prevIdx = typeof prev.index === "number" ? prev.index : 0;
						const currIdx = typeof curr.index === "number" ? curr.index : prevIdx + 1000;
						newIndex = prevIdx < currIdx ? (prevIdx + currIdx) / 2 : currIdx - 0.5;
					}
				} else {
					const lastItem = tasks[tasks.length - 1];
					newIndex = lastItem && typeof lastItem.index === "number" ? lastItem.index + 1000 : 1000;
				}
			}
		} else {
			// Reordering within the SAME column
			if (!isOverColumn && activeId !== overId) {
				const oldIndex = tasks.findIndex((t) => t.id === activeId);
				const targetIndex = tasks.findIndex((t) => t.id === overId);

				if (oldIndex >= 0 && targetIndex >= 0) {
					const reordered = arrayMove(tasks, oldIndex, targetIndex);
					const prev = reordered[targetIndex - 1];
					const next = reordered[targetIndex + 1];

					if (!prev && !next) {
						newIndex = 1000;
					} else if (!prev) {
						newIndex = next && typeof next.index === "number" ? (next.index > 0 ? next.index / 2 : next.index - 1000) : 1000;
					} else if (!next) {
						newIndex = prev && typeof prev.index === "number" ? prev.index + 1000 : 1000;
					} else {
						const prevIdx = typeof prev.index === "number" ? prev.index : 0;
						const nextIdx = typeof next.index === "number" ? next.index : prevIdx + 1000;
						newIndex = prevIdx < nextIdx ? (prevIdx + nextIdx) / 2 : prevIdx + 0.5;
					}
				}
			}
		}

		if (isNaN(newIndex) || typeof newIndex !== "number") {
			newIndex = 1000;
		}

		if (activeTask.status !== newStatus || Math.abs(activeTask.index - newIndex) > 0.0001) {
			updateStatusMutation.mutate({ taskId: activeId, status: newStatus, index: newIndex });
		}
	};

	return (
		<div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
			<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
				<div className="flex h-full gap-3 overflow-x-auto py-4 w-full snap-x snap-mandatory">
					{columns.map((col) => (
						<KanbanColumn
							key={col.status}
							projectId={projectId}
							status={col.status}
							title={col.title}
							onTaskClick={(taskId) => setSelectedTaskId(taskId)}
							canManageLabels={canManageLabels}
						/>
					))}
				</div>

				{mounted &&
					createPortal(
						<DragOverlay dropAnimation={null}>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>,
						document.body,
					)}

				{selectedTaskId && <TaskDetails taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
			</DndContext>
		</div>
	);
}
