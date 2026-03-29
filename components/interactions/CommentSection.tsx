"use client";

import { createComment } from "@/app/actions/comments";
import { useTaskComments } from "@/hooks/useTaskComments";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/app/generated/prisma";

import { Loader2, Reply } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface CommentWithAuthor {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	taskId: string;
	authorId: string;
	author: User;
	parentId: string | null;
	replies: CommentWithAuthor[];
}

interface CommentSectionProps {
	taskId: string;
}

export function CommentSection({ taskId }: CommentSectionProps) {
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const [content, setContent] = useState("");
	const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
	const [isPending, startTransition] = useTransition();
	const { ref, inView } = useInView();

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useTaskComments(taskId);

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

	const comments = (data?.pages.flatMap((page) => page.comments) ?? []) as unknown as CommentWithAuthor[];

	const [optimisticComments, addOptimisticComment] = useOptimistic(comments, (state, newComment: CommentWithAuthor) => {
		if (newComment.parentId) {
			return state.map((c) => {
				if (c.id === newComment.parentId) {
					return { ...c, replies: [...(c.replies || []), newComment] };
				}
				return c;
			});
		}
		return [newComment, ...state];
	});

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
			parentId: replyingTo?.id || null,
			author: {
				...session.user,
				id: session.user.id!,
				name: session.user.name!,
				email: session.user.email!,
				image: session.user.image!,
			} as unknown as User,
			replies: [],
		};

		const formData = new FormData();
		formData.append("content", content);
		if (replyingTo) {
			formData.append("parentId", replyingTo.id);
		}

		startTransition(async () => {
			addOptimisticComment(tempComment);
			try {
				await createComment(taskId, formData);
				setContent("");
				setReplyingTo(null);
				await queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
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
				{replyingTo && (
					<div className="flex items-center justify-between bg-muted/50 p-2 rounded-t-md text-xs text-muted-foreground border-b border-border">
						<span>
							Replying to <strong className="text-foreground">{replyingTo.name}</strong>
						</span>
						<button type="button" onClick={() => setReplyingTo(null)} className="hover:text-foreground">
							Cancel
						</button>
					</div>
				)}
				<InputGroup className={replyingTo ? "rounded-t-none" : ""}>
					<InputGroupTextarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder={session?.user ? (replyingTo ? "Write a reply..." : "Add a comment...") : "Sign in to comment"}
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
							<div key={comment.id} className="flex flex-col gap-2">
								<div className="bg-muted/50 p-3 rounded-md text-sm flex gap-2">
									<Avatar className="h-6 w-6">
										<AvatarImage
											src={comment.author.image || ""}
											alt={comment.author.name || "User"}
											referrerPolicy="no-referrer"
										/>
										<AvatarFallback>{comment.author.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
									</Avatar>
									<div className="flex-1 space-y-1">
										<div className="flex justify-between items-center">
											<span className="font-semibold text-foreground">{comment.author.name}</span>
											<span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
										</div>
										<p className="text-foreground leading-relaxed break-words whitespace-pre-wrap">{comment.content}</p>
										{session?.user && (
											<div className="flex justify-end mt-1">
												<Button
													variant="ghost"
													size="sm"
													className="gap-2"
													onClick={() => setReplyingTo({ id: comment.id, name: comment.author.name || "User" })}
												>
													<Reply className="size-4" />
													Reply
												</Button>
											</div>
										)}
									</div>
								</div>
								{comment.replies && comment.replies.length > 0 && (
									<div className="pl-4 ml-3 border-l-2 border-muted space-y-2">
										{comment.replies.map((reply) => (
											<div key={reply.id} className="bg-muted/30 p-3 rounded-md text-sm flex gap-2">
												<Avatar className="h-5 w-5">
													<AvatarImage
														src={reply.author.image || ""}
														alt={reply.author.name || "User"}
														referrerPolicy="no-referrer"
													/>
													<AvatarFallback>{reply.author.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
												</Avatar>
												<div className="flex-1 space-y-1">
													<div className="flex justify-between items-center">
														<span className="font-semibold text-foreground">{reply.author.name}</span>
														<span className="text-xs text-muted-foreground">
															{new Date(reply.createdAt).toLocaleDateString()}
														</span>
													</div>
													<p className="text-foreground leading-relaxed break-words whitespace-pre-wrap">{reply.content}</p>
												</div>
											</div>
										))}
									</div>
								)}
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
