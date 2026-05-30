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
		where: { projectId, status },
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			index: true,
			projectId: true,
			authorId: true,
			createdAt: true,
			updatedAt: true,
			author: {
				select: { id: true, name: true, email: true, image: true },
			},
			labels: true,
			votes: {
				where: { userId: userId ?? "undefined", status },
				select: { id: true },
			},
		},
		orderBy: { index: "asc" },
		take: ITEMS_PER_PAGE,
		skip,
	});

	const taskIds = tasks.map((t) => t.id);

	const [voteCounts, commentCounts] = await Promise.all([
		prisma.vote.groupBy({
			by: ["taskId"],
			where: { taskId: { in: taskIds } },
			_count: true,
		}),
		prisma.comment.groupBy({
			by: ["taskId"],
			where: { taskId: { in: taskIds } },
			_count: true,
		}),
	]);

	const voteMap = Object.fromEntries(voteCounts.map((v) => [v.taskId, v._count]));
	const commentMap = Object.fromEntries(commentCounts.map((c) => [c.taskId, c._count]));

	return tasks.map((t) => ({
		...t,
		_count: {
			votes: voteMap[t.id] ?? 0,
			comments: commentMap[t.id] ?? 0,
		},
	}));
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

	const [minIndexTask, project] = await Promise.all([
		prisma.task.findFirst({
			where: { projectId, status: TaskStatus.PENDING_SUGGESTION },
			orderBy: { index: "asc" },
			select: { index: true },
		}),
		prisma.project.findUniqueOrThrow({
			where: { id: projectId },
			select: { id: true, name: true, owner: { select: { email: true } } },
		}),
	]);

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
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			index: true,
			projectId: true,
			authorId: true,
			createdAt: true,
			updatedAt: true,
			author: {
				select: { id: true, name: true, email: true, image: true },
			},
		},
	});

	await eventPublisher.publish("TaskCreated", { taskId: task.id, title: task.title });

	const emailsToSend: Set<string> = new Set();

	if (project.owner.email) {
		emailsToSend.add(project.owner.email);
	}

	if (session.user.email) {
		emailsToSend.add(session.user.email);
	}

	if (task.author.email) {
		emailsToSend.add(task.author.email);
	}

	try {
		await resend.emails.send({
			from: env.EMAIL_FROM,
			to: [...emailsToSend],
			subject: `New Task: ${task.title}`,
			react: TaskCreatedEmail({
				authorName: session.user.name || "A user",
				taskTitle: task.title,
				taskDescription: task.description || "",
				taskUrl: `${env.APP_URL}/projects/${projectId}?taskId=${task.id}`,
				projectName: project.name,
			}),
		});
	} catch (error) {
		console.error("Failed to send email", error);
	}

	revalidatePath(`/projects/${projectId}`);
	return task;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, newIndex: number) {
	const session = await getSession();

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		select: {
			id: true,
			status: true,
			index: true,
			projectId: true,
			project: {
				select: { ownerId: true },
			},
		},
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
		select: {
			id: true,
			authorId: true,
			projectId: true,
			project: {
				select: { ownerId: true },
			},
		},
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
	const [task, voteCount] = await Promise.all([
		prisma.task.findUnique({
			where: { id: taskId },
			select: {
				id: true,
				title: true,
				description: true,
				status: true,
				index: true,
				projectId: true,
				authorId: true,
				createdAt: true,
				updatedAt: true,
				author: {
					select: { id: true, name: true, email: true, image: true },
				},
				labels: true,
				project: {
					select: { ownerId: true },
				},
				reactions: {
					select: {
						id: true,
						emoji: true,
						taskId: true,
						userId: true,
						createdAt: true,
						user: {
							select: { id: true, name: true, image: true },
						},
					},
				},
				votes: {
					where: { userId: userId ?? "undefined" },
					select: { id: true },
				},
			},
		}),
		prisma.vote.count({
			where: { taskId },
		}),
	]);

	if (!task) return null;

	return {
		...task,
		_count: { votes: voteCount },
	};
}
