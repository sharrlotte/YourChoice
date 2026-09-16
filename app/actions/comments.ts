"use server";

import { NewCommentEmail } from "@/components/email/NewCommentEmail";
import { getSession } from "@/lib/auth";
import { resend } from "@/lib/email";
import { env } from "@/lib/env";
import { eventPublisher } from "@/lib/events";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { formatErrorMessage } from "@/lib/errors";
import { logServerError } from "@/lib/logger";

const COMMENTS_PER_PAGE = 10;

export async function getComments(taskId: string, cursor?: string) {
	try {
		const comments = await prisma.comment.findMany({
			where: { taskId, parentId: null },
			select: {
				id: true,
				content: true,
				taskId: true,
				authorId: true,
				parentId: true,
				createdAt: true,
				updatedAt: true,
				author: {
					select: { id: true, name: true, email: true, image: true },
				},
				replies: {
					select: {
						id: true,
						content: true,
						taskId: true,
						authorId: true,
						parentId: true,
						createdAt: true,
						updatedAt: true,
						author: {
							select: { id: true, name: true, email: true, image: true },
						},
					},
					orderBy: {
						createdAt: "asc",
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: COMMENTS_PER_PAGE + 1,
			cursor: cursor ? { id: cursor } : undefined,
			skip: cursor ? 1 : 0,
		});

		let nextCursor: string | undefined = undefined;
		if (comments.length > COMMENTS_PER_PAGE) {
			const nextItem = comments.pop();
			nextCursor = nextItem?.id;
		}

		return {
			comments,
			nextCursor,
		};
	} catch (error) {
		logServerError("getComments", error, { taskId, cursor });
		return {
			comments: [],
			nextCursor: undefined,
		};
	}
}

export async function createComment(taskId: string, formData: FormData) {
	try {
		const session = await getSession();

		if (!session?.user) {
			throw new Error("Unauthorized: Please sign in to comment");
		}

		const content = (formData.get("content") as string)?.trim();
		const parentId = formData.get("parentId") as string | null;

		if (!content) {
			throw new Error("Comment content is required");
		}

		const task = await prisma.task.findUnique({
			where: { id: taskId },
			include: {
				author: true,
				project: {
					include: {
						owner: true,
					},
				},
			},
		});

		if (!task) {
			throw new Error("Task not found");
		}

		const comment = await prisma.comment.create({
			data: {
				content,
				taskId,
				authorId: session.user.id,
				parentId: parentId || null,
			},
			include: {
				author: true,
				parent: {
					include: {
						author: true,
					},
				},
			},
		});

		try {
			await eventPublisher.publish("CommentAdded", { taskId, commentId: comment.id });
		} catch (eventError) {
			logServerError("CommentAddedEvent", eventError, { taskId, commentId: comment.id });
		}

		try {
			const emailsToSend: Set<string> = new Set();

			if (task.author.email) {
				emailsToSend.add(task.author.email);
			}

			if (task.project.owner.email) {
				emailsToSend.add(task.project.owner.email);
			}

			if (session.user.email) {
				emailsToSend.add(session.user.email);
			}

			if (comment.parent?.author?.email) {
				emailsToSend.add(comment.parent.author.email);
			}

			if (emailsToSend.size > 0 && env.RESEND_API_KEY) {
				await resend.emails.send({
					from: env.EMAIL_FROM,
					to: [...emailsToSend],
					subject: `New comment on ${task.title}`,
					react: NewCommentEmail({
						authorName: session.user.name || "A user",
						taskTitle: task.title,
						commentContent: content,
						taskUrl: `${env.APP_URL}/projects/${task.projectId}?taskId=${taskId}`,
						projectName: task.project.name,
					}),
				});
			}
		} catch (emailError) {
			logServerError("NewCommentEmail", emailError, { taskId });
		}

		revalidatePath(`/projects/${task.projectId}`);
		return comment;
	} catch (error) {
		logServerError("createComment", error, { taskId });
		throw new Error(formatErrorMessage(error, "Failed to create comment"));
	}
}

