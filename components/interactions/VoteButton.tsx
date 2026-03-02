"use client";

import { TaskStatus } from "@prisma/client";
import { toggleVote } from "@/app/actions/votes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useState, useTransition, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface VoteButtonProps {
	taskId: string;
	initialVotes: number;
	initialHasVoted: boolean;
	taskStatus: TaskStatus;
}

export function VoteButton({ taskId, initialVotes, initialHasVoted, taskStatus }: VoteButtonProps) {
	const { data: session } = useSession();
	const [votes, setVotes] = useState(initialVotes);
	const [hasVoted, setHasVoted] = useState(initialHasVoted);
	const [isPending, startTransition] = useTransition();
	const [showLoginDialog, setShowLoginDialog] = useState(false);

	useEffect(() => {
		setVotes(initialVotes);
		setHasVoted(initialHasVoted);
	}, [initialVotes, initialHasVoted]);

	const isVotingEnabled = taskStatus === TaskStatus.ACCEPTED || taskStatus === TaskStatus.PENDING_SUGGESTION;

	const handleVote = () => {
		if (!isVotingEnabled) return;

		if (!session?.user) {
			setShowLoginDialog(true);
			return;
		}

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
		<>
			<Button
				variant={hasVoted ? "secondary" : "outline"}
				size="sm"
				onClick={(e) => {
					e.stopPropagation();
					handleVote();
				}}
				disabled={isPending || !isVotingEnabled}
			>
				<ThumbsUp size={14} className={cn(hasVoted && "fill-current")} />
				<span>{votes}</span>
			</Button>

			<Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
				<DialogContent onClick={(e) => e.stopPropagation()}>
					<DialogHeader>
						<DialogTitle>Sign in required</DialogTitle>
						<DialogDescription>You need to be signed in to vote on tasks.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setShowLoginDialog(false)}>
							Cancel
						</Button>
						<Button onClick={() => signIn("google")}>Sign in</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
