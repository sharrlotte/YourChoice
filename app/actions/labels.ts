"use server";

import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";
import { formatErrorMessage } from "@/lib/errors";
import { logServerError } from "@/lib/logger";

export async function getLabels(projectId: string) {
	try {
		return await prisma.label.findMany({
			where: { projectId },
			orderBy: { name: "asc" },
		});
	} catch (error) {
		logServerError("getLabels", error, { projectId });
		return [];
	}
}

export async function createLabel(projectId: string, formData: FormData) {
	try {
		const session = await getSession();

		if (!session?.user) {
			throw new Error("Unauthorized: Please sign in");
		}

		const project = await prisma.project.findUnique({ where: { id: projectId } });
		if (!project) throw new Error("Project not found");

		if (project.ownerId !== session.user.id && session.user.role !== Role.DEVELOPER) {
			throw new Error("Unauthorized: Only the project owner or a developer can create labels");
		}

		const name = (formData.get("name") as string)?.trim();
		const color = (formData.get("color") as string)?.trim();

		if (!name) {
			throw new Error("Label name is required");
		}

		const label = await prisma.label.create({
			data: {
				name,
				color: color || "#000000",
				projectId,
			},
		});

		revalidatePath(`/projects/${projectId}`);
		return label;
	} catch (error) {
		logServerError("createLabel", error, { projectId });
		throw new Error(formatErrorMessage(error, "Failed to create label"));
	}
}

export async function assignLabel(taskId: string, labelId: string) {
	try {
		const session = await getSession();

		if (!session?.user) {
			throw new Error("Unauthorized: Please sign in");
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

		if (!task) {
			throw new Error("Task not found");
		}

		if (
			task.project.ownerId !== session.user.id &&
			session.user.role !== Role.DEVELOPER &&
			task.authorId !== session.user.id
		) {
			throw new Error("Unauthorized: You do not have permission to assign labels to this task");
		}

		const updated = await prisma.task.update({
			where: { id: taskId },
			data: {
				labels: {
					connect: { id: labelId },
				},
			},
		});

		revalidatePath(`/projects/${task.projectId}`);
		return updated;
	} catch (error) {
		logServerError("assignLabel", error, { taskId, labelId });
		throw new Error(formatErrorMessage(error, "Failed to assign label"));
	}
}

export async function removeLabel(taskId: string, labelId: string) {
	try {
		const session = await getSession();

		if (!session?.user) {
			throw new Error("Unauthorized: Please sign in");
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

		if (!task) {
			throw new Error("Task not found");
		}

		if (
			task.project.ownerId !== session.user.id &&
			session.user.role !== Role.DEVELOPER &&
			task.authorId !== session.user.id
		) {
			throw new Error("Unauthorized: You do not have permission to remove labels from this task");
		}

		const updated = await prisma.task.update({
			where: { id: taskId },
			data: {
				labels: {
					disconnect: { id: labelId },
				},
			},
		});

		revalidatePath(`/projects/${task.projectId}`);
		return updated;
	} catch (error) {
		logServerError("removeLabel", error, { taskId, labelId });
		throw new Error(formatErrorMessage(error, "Failed to remove label"));
	}
}

