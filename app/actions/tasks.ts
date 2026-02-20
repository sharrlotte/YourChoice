"use server";

import { auth } from "@/lib/auth";
import { eventPublisher } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const ITEMS_PER_PAGE = 10;

export async function getTasks(projectId: string, status: TaskStatus, page: number = 1, sortBy: "index" | "votes" = "index") {
	const session = await auth();
	const userId = session?.user?.id;

	const skip = (page - 1) * ITEMS_PER_PAGE;

	const orderBy = sortBy === "votes" ? { votes: { _count: "desc" } } : { index: "asc" };

	const tasks = await prisma.task.findMany({
		where: {
			projectId,
			status,
		},
		include: {
			author: true,
			labels: true,
			_count: {
				select: {
					votes: true,
					comments: true,
				},
			},
			votes: {
				where: {
					userId: userId ?? "undefined",
					status: status,
				},
			},
		},
		orderBy: orderBy as any,
		take: ITEMS_PER_PAGE,
		skip,
	});

	return tasks;
}

export async function createTask(projectId: string, formData: FormData) {
	const session = await auth();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const title = formData.get("title") as string;
	const description = formData.get("description") as string;

	if (!title) {
		throw new Error("Title is required");
	}

	// Get max index for the pending status
	const maxIndexTask = await prisma.task.findFirst({
		where: {
			projectId,
			status: TaskStatus.PENDING_SUGGESTION,
		},
		orderBy: {
			index: "desc",
		},
	});

	const newIndex = (maxIndexTask?.index ?? -1) + 1;

	const task = await prisma.task.create({
		data: {
			title,
			description,
			projectId,
			authorId: session.user.id,
			status: TaskStatus.PENDING_SUGGESTION,
			index: newIndex,
		},
	});

	await eventPublisher.publish("TaskCreated", { taskId: task.id, title: task.title });

	revalidatePath(`/projects/${projectId}`);
	return task;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, newIndex: number) {
	const session = await auth();
	// Developer role check for moving tasks?
	if (!session?.user || session.user.role !== "DEVELOPER") {
		throw new Error("Unauthorized: Only developers can move tasks");
	}

	const task = await prisma.task.findUnique({
		where: { id: taskId },
	});

	if (!task) {
		throw new Error("Task not found");
	}

	const oldStatus = task.status;
	const oldIndex = task.index;

	// If status changed or index changed
	if (oldStatus !== newStatus || oldIndex !== newIndex) {
		await prisma.$transaction(async (tx) => {
			// 1. Remove from old column (close gap)
			if (oldStatus === newStatus) {
				// Moving within same column
				if (oldIndex < newIndex) {
					// Moved down: Shift items between oldIndex+1 and newIndex UP (decrement index)
					await tx.task.updateMany({
						where: {
							projectId: task.projectId,
							status: oldStatus,
							index: { gt: oldIndex, lte: newIndex },
						},
						data: { index: { decrement: 1 } },
					});
				} else {
					// Moved up: Shift items between newIndex and oldIndex-1 DOWN (increment index)
					await tx.task.updateMany({
						where: {
							projectId: task.projectId,
							status: oldStatus,
							index: { gte: newIndex, lt: oldIndex },
						},
						data: { index: { increment: 1 } },
					});
				}
			} else {
				// Moving to different column
				// Close gap in old column
				await tx.task.updateMany({
					where: {
						projectId: task.projectId,
						status: oldStatus,
						index: { gt: oldIndex },
					},
					data: { index: { decrement: 1 } },
				});

				// Make space in new column
				await tx.task.updateMany({
					where: {
						projectId: task.projectId,
						status: newStatus,
						index: { gte: newIndex },
					},
					data: { index: { increment: 1 } },
				});
			}

			// Update the task
			await tx.task.update({
				where: { id: taskId },
				data: {
					status: newStatus,
					index: newIndex,
				},
			});
		});

		if (oldStatus !== newStatus) {
			await eventPublisher.publish("TaskStatusChanged", { taskId, oldStatus, newStatus });
		}
	}

	revalidatePath(`/projects/${task.projectId}`);
}

export async function updateTaskDetails(taskId: string, formData: FormData) {
	const session = await auth();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const task = await prisma.task.findUnique({ where: { id: taskId } });
	if (!task) throw new Error("Task not found");

	if (session.user.role !== "DEVELOPER" && task.authorId !== session.user.id) {
		throw new Error("Unauthorized");
	}

	const title = formData.get("title") as string;
	const description = formData.get("description") as string;

	await prisma.task.update({
		where: { id: taskId },
		data: {
			title,
			description,
		},
	});

	revalidatePath(`/projects/${task.projectId}`);
}

export async function getTaskDetails(taskId: string) {
	const session = await auth();
	const userId = session?.user?.id;

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: {
			author: true,
			labels: true,
			comments: {
				include: {
					author: true,
				},
				orderBy: {
					createdAt: "desc",
				},
			},
			reactions: {
				include: {
					user: true,
				},
			},
			votes: {
				where: {
					userId: userId ?? "undefined",
					// We also need to check status matches current status
					// But `task` is fetched here, so we don't know status beforehand easily
					// However, `votes` relation includes `status`.
					// So if we filter by userId, we get all votes by user for this task.
					// We can filter in JS or just return them.
					// Let's return all votes by user for this task, client can check against task.status.
				},
			},
			_count: {
				select: {
					votes: true,
				},
			},
		},
	});

	return task;
}
