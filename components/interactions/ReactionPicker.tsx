"use client";

import { toggleReaction } from "@/app/actions/reactions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reaction, User } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";

interface ReactionWithUser extends Reaction {
	user: User;
}

interface ReactionPickerProps {
	taskId: string;
	reactions: ReactionWithUser[];
	currentUserId?: string;
}

const COMMON_EMOJIS = ["👍", "👎", "🚀", "🎉", "👀", "❤️"];

export function ReactionPicker({ taskId, reactions, currentUserId }: ReactionPickerProps) {
	const [isPending, startTransition] = useTransition();
	const queryClient = useQueryClient();
	const [showPicker, setShowPicker] = useState(false);

	// Group reactions by emoji
	const reactionCounts = reactions.reduce(
		(acc, reaction) => {
			if (!acc[reaction.emoji]) {
				acc[reaction.emoji] = { count: 0, hasReacted: false };
			}
			acc[reaction.emoji].count++;
			if (reaction.userId === currentUserId) {
				acc[reaction.emoji].hasReacted = true;
			}
			return acc;
		},
		{} as Record<string, { count: number; hasReacted: boolean }>,
	);

	const handleToggle = (emoji: string) => {
		startTransition(async () => {
			try {
				await toggleReaction(taskId, emoji);
				queryClient.invalidateQueries({ queryKey: ["task", taskId] });
				setShowPicker(false);
			} catch (error) {
				console.error("Failed to toggle reaction:", error);
			}
		});
	};

	return (
		<div className="flex flex-wrap gap-2 mt-4">
			{Object.entries(reactionCounts).map(([emoji, { count, hasReacted }]) => (
				<button
					key={emoji}
					onClick={() => handleToggle(emoji)}
					disabled={isPending}
					className={cn(
						"flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors",
						hasReacted ? "bg-blue-100 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100",
					)}
				>
					<span>{emoji}</span>
					<span>{count}</span>
				</button>
			))}

			<div className="relative">
				<Button variant="outline" size="icon" className="h-6 w-6 rounded-full" onClick={() => setShowPicker(!showPicker)}>
					<Plus size={14} />
				</Button>

				{showPicker && (
					<div className="absolute top-8 left-0 z-10 bg-white shadow-lg rounded p-2 border flex gap-1 w-max">
						{COMMON_EMOJIS.map((emoji) => (
							<button key={emoji} onClick={() => handleToggle(emoji)} className="hover:bg-gray-100 p-1 rounded text-lg">
								{emoji}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
