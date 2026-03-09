"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { TaskWithRelations } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MessageSquare, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskStatus } from "@/app/generated/prisma";

const statusColors: Record<TaskStatus, string> = {
	PENDING_SUGGESTION: "border-l-orange-500",
	ACCEPTED: "border-l-blue-500",
	REJECTED: "border-l-red-500",
	IN_PROGRESS: "border-l-purple-500",
	COMPLETED: "border-l-green-500",
};

interface TaskCardProps {
	task: TaskWithRelations;
	onClick?: () => void;
	disabled?: boolean;
}

export function TaskCard({ task, onClick, disabled }: TaskCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: task.id,
		data: {
			type: "Task",
			task,
		},
		disabled,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const borderColor = statusColors[task.status] || "border-l-primary";

	return (
		<Card
			ref={setNodeRef}
			style={style}
			className={`mb-2 group relative hover:shadow-md transition-shadow cursor-pointer border-l-4 ${borderColor} select-none`}
			onClick={onClick}
		>
			<CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
				<h3 className="font-medium text-sm text-foreground pr-4 leading-tight">{task.title}</h3>
				{!disabled && (
					<button
						{...attributes}
						{...listeners}
						className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground absolute top-2 right-2"
						onClick={(e) => e.stopPropagation()}
					>
						<GripVertical size={16} />
					</button>
				)}
			</CardHeader>
			<CardContent className="p-3 pt-2">
				<p className="text-muted-foreground line-clamp-3 text-sm">{task.description}</p>
				<div className="flex flex-wrap gap-1 mt-2">
					{task.labels.map((label) => (
						<Badge
							key={label.id}
							variant="secondary"
							className="text-[10px] px-1.5 py-0 h-5"
							style={{ backgroundColor: label.color, color: "#fff" }} // Override if custom color
						>
							{label.name}
						</Badge>
					))}
				</div>
			</CardContent>

			<CardFooter className="p-3 pt-0 flex items-center justify-between text-xs text-muted-foreground">
				<div className="flex items-center gap-2" title={`Created by ${task.author.name}`}>
					<Avatar className="h-5 w-5">
						<AvatarImage src={task.author.image || ""} alt={task.author.name || ""} />
						<AvatarFallback className="text-[10px]">{task.author.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
					</Avatar>
					<span className="text-[10px] truncate max-w-[180px] hidden sm:inline-block">{task.author.name}</span>
				</div>
				<div className="flex items-center gap-3 ml-auto">
					<div className={`flex items-center gap-1 ${task.votes?.length ? "text-white font-medium" : ""}`}>
						<ThumbsUp size={12} className={task.votes?.length ? "fill-current" : ""} />
						<span>{task._count.votes}</span>
					</div>
					<div className="flex items-center gap-1">
						<MessageSquare size={12} />
						<span>{task._count.comments}</span>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}
