"use server";

import { auth } from "@/lib/auth";
import { eventPublisher } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const COMMENTS_PER_PAGE = 10;

export async function getComments(taskId: string, cursor?: string) {
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      author: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: COMMENTS_PER_PAGE + 1, // Fetch one more to check for next page
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
}

export async function createComment(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const content = formData.get("content") as string;
  if (!content) {
    throw new Error("Content is required");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      taskId,
      authorId: session.user.id,
    },
    include: {
      author: true,
    },
  });

  await eventPublisher.publish("CommentAdded", { taskId, commentId: comment.id });

  revalidatePath(`/projects/${task.projectId}`);
  return comment;
}
