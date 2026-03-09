"use client";

import { getTaskDetails, updateTaskDetails } from "@/app/actions/tasks";
import { LabelSelector } from "@/components/board/LabelSelector";
import { CommentSection } from "@/components/interactions/CommentSection";
import { ReactionPicker } from "@/components/interactions/ReactionPicker";
import { VoteButton } from "@/components/interactions/VoteButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface TaskDetailsProps {
	taskId: string;
	onClose: () => void;
}

export function TaskDetails({ taskId, onClose }: TaskDetailsProps) {
	const { data: session } = useSession();
	const queryClient = useQueryClient();
	const [isEditing, setIsEditing] = useState(false);
	const [isPending, startTransition] = useTransition();

	const {
		data: task,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["task", taskId],
		queryFn: () => getTaskDetails(taskId),
	});

	const isDeveloper = (session?.user as any)?.role === "DEVELOPER";
	const isProjectOwner = task?.project?.ownerId === session?.user?.id;
	const isTaskOwner = task?.authorId === session?.user?.id;
	const canManageLabels = isDeveloper || isProjectOwner || isTaskOwner;
	const canEditTask = isDeveloper || isProjectOwner || isTaskOwner;

	const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!task) return;

		const formData = new FormData(e.currentTarget);
		startTransition(async () => {
			try {
				await updateTaskDetails(task.id, formData);
				toast.success("Task updated");
				setIsEditing(false);
				queryClient.invalidateQueries({ queryKey: ["task", taskId] });
				queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] });
			} catch (error) {
				toast.error("Failed to update task");
			}
		});
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
				{isLoading ? (
					<div className="flex-1 flex items-center justify-center">
						<DialogTitle className="sr-only">Loading task details</DialogTitle>
						<Loader2 className="animate-spin text-primary" size={32} />
					</div>
				) : error || !task ? (
					<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
						<DialogTitle className="sr-only">Error loading task</DialogTitle>
						<h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
						<p className="text-muted-foreground mb-4">Failed to load task details.</p>
						<Button onClick={onClose}>Close</Button>
					</div>
				) : (
					<>
						<DialogHeader className="p-6 pb-2 border-b">
							<div className="flex justify-between items-start pr-4 gap-4">
								{isEditing ? (
									<div className="w-full">
										<DialogTitle className="sr-only">Edit Task</DialogTitle>
										{/* Form is handled in the body, but title input could be here if we want sticky header. 
                                            However, keeping form in one place is easier. 
                                            Let's put the title input here if we are editing. */}
									</div>
								) : (
									<div className="flex-1 min-w-0">
										<DialogTitle className="text-2xl font-bold break-words">{task.title}</DialogTitle>
									</div>
								)}

								<div className="flex items-center gap-2 shrink-0">
									{canManageLabels && !isEditing && (
										<LabelSelector taskId={task.id} projectId={task.projectId} assignedLabels={task.labels} />
									)}
									{canEditTask && !isEditing && (
										<Button className="border-dashed" variant="outline" size="icon" onClick={() => setIsEditing(true)}>
											<Pencil size={18} />
										</Button>
									)}
								</div>
							</div>

							{!isEditing && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 flex-wrap">
									<Avatar className="h-8 w-8">
										<AvatarImage src={task.author.image || ""} alt={task.author.name || ""} />
										<AvatarFallback>{task.author.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
									</Avatar>
									<span>{task.author.name}</span>
									<span>•</span>
									<span>{new Date(task.createdAt).toDateString()}</span>
									<span>•</span>
									<Badge variant="outline" className="uppercase text-xs font-medium">
										{task.status.replace(/_/g, " ")}
									</Badge>
									{task.labels.map((label) => (
										<Badge key={label.id} style={{ backgroundColor: label.color, color: "#fff" }} className="border-0">
											{label.name}
										</Badge>
									))}
								</div>
							)}
						</DialogHeader>

						<ScrollArea className="flex-1">
							<div className="p-6">
								{isEditing ? (
									<form onSubmit={handleSave} className="space-y-4">
										<div className="space-y-2">
											<label htmlFor="title" className="text-sm font-medium">
												Title
											</label>
											<Input id="title" name="title" defaultValue={task.title} required disabled={isPending} />
										</div>
										<div className="space-y-2">
											<label htmlFor="description" className="text-sm font-medium">
												Description
											</label>
											<Textarea
												id="description"
												name="description"
												defaultValue={task.description || ""}
												className="min-h-[200px]"
												disabled={isPending}
											/>
										</div>
										<div className="flex justify-end gap-2 pt-4">
											<Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
												Cancel
											</Button>
											<Button type="submit" disabled={isPending}>
												{isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
												Save Changes
											</Button>
										</div>
									</form>
								) : (
									<>
										<div className="prose dark:prose-invert max-w-none text-foreground mb-8 break-words whitespace-pre-wrap text-sm">
											{task.description || <span className="italic text-muted-foreground">No description provided.</span>}
										</div>

										<div className="flex flex-col gap-2 border-t pt-4">
											<div className="flex items-center gap-2">
												<VoteButton
													taskId={task.id}
													initialVotes={task._count.votes}
													initialHasVoted={task.votes.length > 0}
													taskStatus={task.status}
												/>
											</div>
											<p className="text-sm text-muted-foreground">
												Votes help the project owner decide which task is important and should be done first.
											</p>
										</div>

										<ReactionPicker taskId={task.id} reactions={task.reactions} currentUserId={session?.user?.id} />

										<CommentSection taskId={task.id} />
									</>
								)}
							</div>
						</ScrollArea>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
