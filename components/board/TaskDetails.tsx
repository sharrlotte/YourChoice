"use client";

import { getTaskDetails } from "@/app/actions/tasks";
import { LabelSelector } from "@/components/board/LabelSelector";
import { CommentSection } from "@/components/interactions/CommentSection";
import { ReactionPicker } from "@/components/interactions/ReactionPicker";
import { VoteButton } from "@/components/interactions/VoteButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface TaskDetailsProps {
	taskId: string;
	onClose: () => void;
}

export function TaskDetails({ taskId, onClose }: TaskDetailsProps) {
	const { data: session } = useSession();
	const {
		data: task,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["task", taskId],
		queryFn: () => getTaskDetails(taskId),
	});

	const isDeveloper = session?.user?.role === "DEVELOPER";
	const isProjectOwner = task?.project?.ownerId === session?.user?.id;
	const canManageLabels = isDeveloper || isProjectOwner;

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
							<div className="flex justify-between items-start pr-4">
								<DialogTitle className="text-2xl font-bold">{task.title}</DialogTitle>
								{canManageLabels && <LabelSelector taskId={task.id} projectId={task.projectId} assignedLabels={task.labels} />}
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 flex-wrap">
								<span>{task.author.name}</span>
								<span>•</span>
								<span>{new Date(task.createdAt).toLocaleDateString()}</span>
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
						</DialogHeader>

						<ScrollArea className="flex-1">
							<div className="p-6">
								<div className="prose dark:prose-invert max-w-none text-foreground mb-8">
									{task.description || <span className="italic text-muted-foreground">No description provided.</span>}
								</div>

								<div className="flex flex-col gap-2 mb-6 border-t pt-4">
									<div className="flex items-center gap-2">
										<span className="font-semibold text-foreground">Votes:</span>
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
							</div>
						</ScrollArea>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
