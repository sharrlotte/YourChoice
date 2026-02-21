"use client";

import { TaskStatus } from "@prisma/client";
import { toggleVote } from "@/app/actions/votes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useState, useTransition, useEffect } from "react";

interface VoteButtonProps {
	taskId: string;
	initialVotes: number;
	initialHasVoted: boolean;
	taskStatus: TaskStatus;
}

export function VoteButton({ taskId, initialVotes, initialHasVoted, taskStatus }: VoteButtonProps) {
	const [votes, setVotes] = useState(initialVotes);
	const [hasVoted, setHasVoted] = useState(initialHasVoted);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setVotes(initialVotes);
		setHasVoted(initialHasVoted);
	}, [initialVotes, initialHasVoted]);

	const isVotingEnabled = taskStatus === TaskStatus.ACCEPTED || taskStatus === TaskStatus.PENDING_SUGGESTION;

	const handleVote = () => {
		if (!isVotingEnabled) return;

		// Optimistic update
		const newHasVoted = !hasVoted;
		setHasVoted(newHasVoted);
		setVotes((prev) => (newHasVoted ? prev + 1 : prev - 1));

		startTransition(async () => {
			try {
				await toggleVote(taskId);
			} catch (error) {
				// Revert on error
				setHasVoted(!newHasVoted);
				setVotes((prev) => (!newHasVoted ? prev + 1 : prev - 1));
				console.error("Failed to vote:", error);
				toast.error("Failed to vote");
			}
		});
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={(e) => {
				e.stopPropagation();
				handleVote();
			}}
			disabled={isPending || !isVotingEnabled}
			className={cn(
				"flex items-center gap-1",
				hasVoted && "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200",
				!isVotingEnabled && "opacity-50 cursor-not-allowed"
			)}
		>
			<ThumbsUp size={14} className={cn(hasVoted && "fill-current")} />
			<span>{votes}</span>
		</Button>
	);
}
