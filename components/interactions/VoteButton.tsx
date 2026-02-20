"use client";

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
}

export function VoteButton({ taskId, initialVotes, initialHasVoted }: VoteButtonProps) {
	const [votes, setVotes] = useState(initialVotes);
	const [hasVoted, setHasVoted] = useState(initialHasVoted);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setVotes(initialVotes);
		setHasVoted(initialHasVoted);
	}, [initialVotes, initialHasVoted]);

	const handleVote = () => {
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
			variant="ghost"
			size="sm"
			onClick={(e) => {
				e.stopPropagation();
				handleVote();
			}}
			disabled={isPending}
			className={cn("flex items-center gap-1 hover:bg-gray-100", hasVoted && "text-blue-600 bg-blue-50 hover:bg-blue-100")}
		>
			<ThumbsUp size={14} className={cn(hasVoted && "fill-current")} />
			<span>{votes}</span>
		</Button>
	);
}
