"use server";

import { auth } from "@/lib/auth";
import { eventPublisher } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  });

  await eventPublisher.publish("CommentAdded", { taskId, commentId: comment.id });

  revalidatePath(`/projects/${task.projectId}`);
  return comment;
}
