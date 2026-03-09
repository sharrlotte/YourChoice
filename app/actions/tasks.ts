"use server";

import { TaskStatus } from "@/app/generated/prisma";
import { TaskCreatedEmail } from "@/components/email/TaskCreatedEmail";
import { getSession } from "@/lib/auth";
import { resend } from "@/lib/email";
import { env } from "@/lib/env";
import { eventPublisher } from "@/lib/events";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const ITEMS_PER_PAGE = 10;

export async function getTasks(projectId: string, status: TaskStatus, page: number = 1) {
	const session = await getSession();
	const userId = session?.user?.id;

	const skip = (page - 1) * ITEMS_PER_PAGE;

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
		orderBy: { index: "asc" },
		take: ITEMS_PER_PAGE,
		skip,
	});

	return tasks;
}

export async function createTask(projectId: string, formData: FormData) {
	const session = await getSession();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const title = formData.get("title") as string;
	const description = formData.get("description") as string;
	const labelIds = formData.getAll("labels") as string[];

	if (!title) {
		throw new Error("Title is required");
	}

	const minIndexTask = await prisma.task.findFirst({
		where: {
			projectId,
			status: TaskStatus.PENDING_SUGGESTION,
		},
		orderBy: {
			index: "asc",
		},
	});

	const newIndex = minIndexTask && !isNaN(minIndexTask.index) ? minIndexTask.index / 2 : 1000;

	const task = await prisma.task.create({
		data: {
			title,
			description,
			projectId,
			authorId: session.user.id,
			status: TaskStatus.PENDING_SUGGESTION,
			index: newIndex,
			labels: {
				connect: labelIds.map((id) => ({ id })),
			},
		},
	});

	await eventPublisher.publish("TaskCreated", { taskId: task.id, title: task.title });

	// Send email notification to project owner
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		include: { owner: true },
	});

	if (project?.owner.email && project.owner.email !== session.user.email && env.RESEND_API_KEY) {
		try {
			await resend.emails.send({
				from: env.EMAIL_FROM,
				to: project.owner.email,
				subject: `New Task: ${task.title}`,
				react: TaskCreatedEmail({
					authorName: session.user.name || "A user",
					taskTitle: task.title,
					taskDescription: task.description || "",
					taskUrl: `${env.APP_URL}/projects/${projectId}?task=${task.id}`,
					projectName: project.name,
				}),
			});
		} catch (error) {
			console.error("Failed to send email", error);
		}
	}

	revalidatePath(`/projects/${projectId}`);
	return task;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, newIndex: number) {
	const session = await getSession();

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: { project: true },
	});

	if (!task) {
		throw new Error("Task not found");
	}

	if (!session?.user || (session.user.role !== "DEVELOPER" && task.project.ownerId !== session.user.id)) {
		throw new Error("Unauthorized: Only project owners or developers can move tasks");
	}

	const oldStatus = task.status;
	const oldIndex = task.index;

	if (oldStatus !== newStatus || oldIndex !== newIndex) {
		const safeIndex = isNaN(newIndex) ? oldIndex || 1000 : newIndex;
		await prisma.task.update({
			where: { id: taskId },
			data: {
				status: newStatus,
				index: safeIndex,
			},
		});

		await prisma.$executeRaw`
			WITH ranked AS (
				SELECT id, ROW_NUMBER() OVER (ORDER BY "index") as rn
				FROM "Task"
				WHERE "projectId" = ${task.projectId} AND "status" = ${newStatus}::"TaskStatus"
			)
			UPDATE "Task"
			SET "index" = ranked.rn * 1000
			FROM ranked
			WHERE "Task".id = ranked.id
		`;

		if (oldStatus !== newStatus) {
			await eventPublisher.publish("TaskStatusChanged", { taskId, oldStatus, newStatus });
		}
	}

	revalidatePath(`/projects/${task.projectId}`);
}

export async function updateTaskDetails(taskId: string, formData: FormData) {
	const session = await getSession();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: { project: true },
	});
	if (!task) throw new Error("Task not found");

	if (session.user.role !== "DEVELOPER" && task.authorId !== session.user.id && task.project.ownerId !== session.user.id) {
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
	const session = await getSession();
	const userId = session?.user?.id;

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: {
			author: true,
			labels: true,
			project: {
				select: {
					ownerId: true,
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
