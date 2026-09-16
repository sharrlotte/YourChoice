"use server";

import { getSession } from "@/lib/auth";
import { eventPublisher } from "@/lib/events";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { formatErrorMessage } from "@/lib/errors";
import { logServerError } from "@/lib/logger";

export async function toggleVote(taskId: string) {
	try {
		const session = await getSession();
		if (!session?.user) {
			throw new Error("Unauthorized: Please sign in to vote");
		}

		const task = await prisma.task.findUnique({
			where: { id: taskId },
			select: { id: true, status: true, projectId: true },
		});

		if (!task) {
			throw new Error("Task not found");
		}

		const existingVote = await prisma.vote.findUnique({
			where: {
				taskId_userId_status: {
					taskId,
					userId: session.user.id,
					status: task.status,
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
					status: task.status,
				},
			});

			try {
				await eventPublisher.publish("TaskVoted", { taskId, userId: session.user.id });
			} catch (eventError) {
				logServerError("TaskVotedEvent", eventError, { taskId });
			}
		}

		revalidatePath(`/projects/${task.projectId}`);
	} catch (error) {
		logServerError("toggleVote", error, { taskId });
		throw new Error(formatErrorMessage(error, "Failed to vote"));
	}
}

