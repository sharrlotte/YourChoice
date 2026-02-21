"use client";

import { createComment } from "@/app/actions/comments";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { User } from "@prisma/client";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";

interface CommentWithAuthor {
	id: string;
	content: string;
	createdAt: Date;
	author: User;
}

interface CommentSectionProps {
	taskId: string;
	initialComments: CommentWithAuthor[];
}

export function CommentSection({ taskId, initialComments }: CommentSectionProps) {
	const [comments, setComments] = useState(initialComments);
	const [content, setContent] = useState("");
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setComments(initialComments);
	}, [initialComments]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;

		const formData = new FormData();
		formData.append("content", content);

		startTransition(async () => {
			try {
				const newComment = await createComment(taskId, formData);
				setContent("");
				toast.success("Comment posted");
			} catch (error) {
				console.error("Failed to add comment:", error);
				toast.error("Failed to add comment");
			}
		});
	};

	return (
		<div className="mt-4">
			<h3 className="font-semibold text-foreground mb-2">Comments</h3>
			<div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
				{comments.map((comment) => (
					<div key={comment.id} className="bg-muted/50 p-2 rounded text-sm">
						<div className="flex justify-between items-center mb-1">
							<span className="font-medium text-foreground">{comment.author.name}</span>
							<span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
						</div>
						<p className="text-foreground">{comment.content}</p>
					</div>
				))}
				{comments.length === 0 && <p className="text-muted-foreground text-sm">No comments yet.</p>}
			</div>

			<form onSubmit={handleSubmit} className="mt-2 px-1">
				<InputGroup>
					<InputGroupTextarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="Add a comment..."
						disabled={isPending}
						maxLength={500}
					/>
					<InputGroupAddon align="block-end">
						<InputGroupText>
							{content.length}/500
						</InputGroupText>
						<InputGroupButton type="submit" disabled={isPending || !content.trim()} size="sm">
							{isPending ? "Posting..." : "Post"}
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</form>
		</div>
	);
}
