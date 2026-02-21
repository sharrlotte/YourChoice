"use client";

import { createComment, getComments } from "@/app/actions/comments";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group";
import { User } from "@prisma/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

interface CommentWithAuthor {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	taskId: string;
	authorId: string;
	author: User;
}

interface CommentSectionProps {
	taskId: string;
}

export function CommentSection({ taskId }: CommentSectionProps) {
	const { data: session } = useSession();
	const [content, setContent] = useState("");
	const [isPending, startTransition] = useTransition();
	const { ref, inView } = useInView();

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
		queryKey: ["comments", taskId],
		queryFn: async ({ pageParam }) => {
			const res = await getComments(taskId, pageParam as string | undefined);
			return res;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

	const comments = data?.pages.flatMap((page) => page.comments) ?? [];

	// Optimistic updates need to be applied on top of the fetched comments
	// We reverse the optimistic logic: newest comments are at the top usually, but here we render a list.
	// The current UI renders comments in a list.
	// If the server returns comments in descending order (newest first), then optimistic comment should be at the top.
	// But the UI currently maps `optimisticComments`.
	// Let's check the UI rendering order.
	// The `getComments` returns `orderBy: { createdAt: "desc" }`.
	// So newest comments are first.
	// Optimistic comment should be prepended.

	const [optimisticComments, addOptimisticComment] = useOptimistic(comments, (state, newComment: CommentWithAuthor) => [
		newComment,
		...state,
	]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim() || !session?.user) return;

		const tempComment: CommentWithAuthor = {
			id: `temp-${Date.now()}`,
			content,
			createdAt: new Date(),
			updatedAt: new Date(),
			taskId,
			authorId: session.user.id!,
			author: {
				...session.user,
				id: session.user.id!,
				name: session.user.name!,
				email: session.user.email!,
				image: session.user.image!,
			} as unknown as User,
		};

		const formData = new FormData();
		formData.append("content", content);

		startTransition(async () => {
			addOptimisticComment(tempComment);
			try {
				await createComment(taskId, formData);
				setContent("");
				toast.success("Comment posted");
			} catch (error) {
				console.error("Failed to add comment:", error);
				toast.error("Failed to add comment");
			}
		});
	};

	return (
		<div className="mt-4 flex flex-col h-full max-h-[500px]">
			<h3 className="font-semibold text-foreground mb-2">Comments</h3>
			<form onSubmit={handleSubmit} className="mt-auto py-2 border-t">
				<InputGroup>
					<InputGroupTextarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder={session?.user ? "Add a comment..." : "Sign in to comment"}
						disabled={isPending || !session?.user}
						maxLength={500}
					/>
					<InputGroupAddon align="block-end">
						<InputGroupText>{content.length}/500</InputGroupText>
						<InputGroupButton type="submit" disabled={isPending || !content.trim() || !session?.user} size="sm">
							{isPending ? "Posting..." : "Post"}
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</form>
			<div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4 min-h-[100px]">
				{status === "pending" ? (
					<div className="flex justify-center py-4">
						<Loader2 className="animate-spin text-muted-foreground" size={20} />
					</div>
				) : (
					<>
						{optimisticComments.map((comment) => (
							<div key={comment.id} className="bg-muted/50 p-2 rounded text-sm">
								<div className="flex justify-between items-center mb-1">
									<span className="font-medium text-foreground">{comment.author.name}</span>
									<span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
								</div>
								<p className="text-foreground">{comment.content}</p>
							</div>
						))}

						{optimisticComments.length === 0 && <p className="text-muted-foreground text-sm">No comments yet.</p>}

						{hasNextPage && (
							<div ref={ref} className="flex justify-center py-2">
								{isFetchingNextPage ? (
									<Loader2 className="animate-spin text-muted-foreground" size={16} />
								) : (
									<span className="text-xs text-muted-foreground">Load more</span>
								)}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
