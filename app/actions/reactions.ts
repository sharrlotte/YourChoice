"use server";

import { getSession } from "@/lib/auth";
import { eventPublisher } from "@/lib/events";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleReaction(taskId: string, emoji: string) {
	const session = await getSession();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const [task, existingReaction] = await Promise.all([
		prisma.task.findUnique({
			where: { id: taskId },
			select: { id: true, projectId: true },
		}),
		prisma.reaction.findUnique({
			where: {
				taskId_userId_emoji: {
					taskId,
					userId: session.user.id,
					emoji,
				},
			},
		}),
	]);

	if (!task) {
		throw new Error("Task not found");
	}

	if (existingReaction) {
		await prisma.reaction.delete({
			where: { id: existingReaction.id },
		});
	} else {
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
