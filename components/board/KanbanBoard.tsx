"use client";

import { updateTaskStatus } from "@/app/actions/tasks";
import { KanbanColumn } from "@/components/board/KanbanColumn";
import { TaskStatus } from "@/app/generated/prisma";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { TaskCard } from "./TaskCard";
import { TaskDetails } from "./TaskDetails";

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

			const previousTasks = queryClient.getQueriesData({ queryKey: ["tasks", projectId] });

			let movedTask: any = null;

			// 1. Find and remove task from old location
			queryClient.setQueriesData({ queryKey: ["tasks", projectId] }, (oldData: any) => {
				if (!oldData || !oldData.pages) return oldData;

				const newPages = oldData.pages.map((page: any[]) => {
					const found = page.find((t) => t.id === taskId);
					if (found) movedTask = found;
					return page.filter((t) => t.id !== taskId);
				});

				return { ...oldData, pages: newPages };
			});

			// 2. Add to new location
			if (movedTask) {
				const updatedTask = { ...movedTask, status: status, index: index };

				queryClient.setQueryData(["tasks", projectId, status, "index"], (oldData: any) => {
					if (!oldData) {
						return { pages: [[updatedTask]], pageParams: [1] };
					}

					const allTasks = oldData.pages.flatMap((page: any[]) => page);
					allTasks.push(updatedTask);
					allTasks.sort((a: any, b: any) => a.index - b.index);

					return { ...oldData, pages: [allTasks] };
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

		const activeTask = active.data.current?.task;
		if (!activeTask) {
			setActiveTask(null);
			return;
		}

		const activeId = active.id as string;
		const overId = over.id as string;

		let newStatus = activeTask.status;

		// Check if dropped on a column (empty area) or on a task
		const isOverColumn = columns.some((col) => col.status === overId);

		if (isOverColumn) {
			newStatus = overId as TaskStatus;
		} else {
			const overTask = over.data.current?.task;
			if (overTask) {
				newStatus = overTask.status;
			}
		}

		// Get tasks for the destination column to calculate index
		// We need to fetch from cache
		const queryKey = ["tasks", projectId, newStatus, "index"];
		const data = queryClient.getQueryData(queryKey) as any;
		const tasks = data?.pages.flatMap((p: any) => p) || [];

		let newIndex = activeTask.index;

		if (activeTask.status !== newStatus && isOverColumn) {
			// Dropped on column -> Add to bottom
			const lastItem = tasks[tasks.length - 1];
			newIndex = lastItem ? lastItem.index + 1000 : 1000;
		} else {
			// Dropped on a task (or reordered within column)
			const overData = over.data.current;
			const overIndex = overData?.sortable?.index;
			const activeIndex = active.data.current?.sortable?.index;

			if (typeof overIndex === "number") {
				let newTasks = [...tasks];

				if (activeTask.status === newStatus && typeof activeIndex === "number") {
					// Reorder within same column
					newTasks = arrayMove(newTasks, activeIndex, overIndex);

					const prev = newTasks[overIndex - 1];
					const next = newTasks[overIndex + 1];

					if (!prev) newIndex = next ? next.index / 2 : 1000;
					else if (!next) newIndex = prev.index + 1000;
					else newIndex = (prev.index + next.index) / 2;
				} else {
					// Move to different column (insert before overIndex)
					const prev = tasks[overIndex - 1];
					const next = tasks[overIndex];

					if (!prev) newIndex = next ? next.index / 2 : 1000;
					else if (!next)
						newIndex = prev.index + 1000; // Should rarely happen if dropping on a task
					else newIndex = (prev.index + next.index) / 2;
				}
			}
		}

		if (activeTask.status !== newStatus || Math.abs(activeTask.index - newIndex) > 0.0001) {
			updateStatusMutation.mutate({ taskId: activeId, status: newStatus, index: newIndex });
		}

		setActiveTask(null);
	};

	return (
		<div className="flex flex-col h-full">
			<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
				<div className="flex h-full gap-4 overflow-x-auto py-4 w-full">
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

				{mounted && createPortal(<DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>, document.body)}

				{selectedTaskId && <TaskDetails taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
			</DndContext>
		</div>
	);
}
