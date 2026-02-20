"use server";

import { auth } from "@/lib/auth";
import { eventPublisher } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleReaction(taskId: string, emoji: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const existingReaction = await prisma.reaction.findUnique({
    where: {
      taskId_userId_emoji: {
        taskId,
        userId: session.user.id,
        emoji,
      },
    },
  });

  if (existingReaction) {
    // Remove reaction
    await prisma.reaction.delete({
      where: { id: existingReaction.id },
    });
  } else {
    // Add reaction
    await prisma.reaction.create({
      data: {
        taskId,
        userId: session.user.id,
        emoji,
      },
    });
    await eventPublisher.publish("ReactionAdded", { taskId, userId: session.user.id, emoji });
  }

  revalidatePath(`/projects/${task.projectId}`);
}
