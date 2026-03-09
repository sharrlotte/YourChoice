"use client";

import { getTasks } from "@/app/actions/tasks";
import { CreateTaskForm } from "@/components/board/CreateTaskForm";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskWithRelations } from "@/types";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskStatus } from "@/app/generated/prisma";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
	projectId: string;
	status: TaskStatus;
	title: string;
	onTaskClick?: (taskId: string) => void;
	canManageLabels?: boolean;
}

export function KanbanColumn({ projectId, status, title, onTaskClick, canManageLabels }: KanbanColumnProps) {
	const { ref, inView } = useInView();

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
		queryKey: ["tasks", projectId, status, "index"],
		queryFn: async ({ pageParam = 1 }) => {
			return getTasks(projectId, status, pageParam);
		},
		getNextPageParam: (lastPage, allPages) => {
			// Assuming page size is 10
			return lastPage.length === 10 ? allPages.length + 1 : undefined;
		},
		initialPageParam: 1,
	});

	const { setNodeRef } = useDroppable({
		id: status,
	});

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

	const tasks = data?.pages.flatMap((page) => page) ?? [];

	return (
		<div className="flex flex-col bg-muted/50 rounded-lg w-full min-w-80 h-full border overflow-hidden snap-center">
			<div className="p-3 font-semibold text-foreground border-b bg-card/20 rounded-t-lg sticky top-0 z-10 flex justify-between items-center shadow-sm">
				<h2 className="text-sm">{title}</h2>
				<Badge variant="secondary" className="px-2 py-0.5 rounded-full text-xs">
					{tasks.length}
				</Badge>
			</div>

			<div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 scrollbar-hide min-h-[100px]">
				{status === "PENDING_SUGGESTION" && (
					<div className="mb-2">
						<CreateTaskForm projectId={projectId} canManageLabels={canManageLabels} />
					</div>
				)}

				<SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
					{tasks.map((task) => (
						<TaskCard
							key={task.id}
							task={task as TaskWithRelations}
							onClick={() => onTaskClick?.(task.id)}
							disabled={!canManageLabels}
						/>
					))}
				</SortableContext>
				<div ref={ref} className="h-1" />
			</div>
		</div>
	);
}
