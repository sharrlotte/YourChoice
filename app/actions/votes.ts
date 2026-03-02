"use server";

import { getSession } from "@/lib/auth";
import { eventPublisher } from "@/lib/events";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleVote(taskId: string) {
	const session = await getSession();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const task = await prisma.task.findUnique({
		where: { id: taskId },
	});

	if (!task) {
		throw new Error("Task not found");
	}

	const currentStatus = task.status;

	const existingVote = await prisma.vote.findUnique({
		where: {
			taskId_userId_status: {
				taskId,
				userId: session.user.id,
				status: currentStatus,
			},
		},
	});

	if (existingVote) {
		await prisma.vote.delete({
			where: { id: existingVote.id },
		});
	} else {
		await prisma.vote.create({
			data: {
				taskId,
				userId: session.user.id,
				status: currentStatus,
			},
		});
		await eventPublisher.publish("TaskVoted", { taskId, userId: session.user.id });
	}

	revalidatePath(`/projects/${task.projectId}`);
}
