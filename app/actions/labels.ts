"use server";

import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";

export async function getLabels(projectId: string) {
	return prisma.label.findMany({
		where: { projectId },
		orderBy: { name: "asc" },
	});
}

export async function createLabel(projectId: string, formData: FormData) {
	const session = await getSession();

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const project = await prisma.project.findUnique({ where: { id: projectId } });
	if (!project) throw new Error("Project not found");

	if (project.ownerId !== session.user.id && session.user.role !== Role.DEVELOPER) {
		throw new Error("Unauthorized");
	}

	const name = formData.get("name") as string;
	const color = formData.get("color") as string;

	if (!name) {
		throw new Error("Name is required");
	}

	await prisma.label.create({
		data: {
			name,
			color: color || "#000000",
			projectId,
		},
	});

	revalidatePath(`/projects/${projectId}`);
}

export async function assignLabel(taskId: string, labelId: string) {
	const session = await getSession();

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: { project: true },
	});

	if (!task) {
		throw new Error("Task not found");
	}

	if (task.project.ownerId !== session.user.id && session.user.role !== Role.DEVELOPER) {
		throw new Error("Unauthorized");
	}

	await prisma.task.update({
		where: { id: taskId },
		data: {
			labels: {
				connect: { id: labelId },
			},
		},
	});

	revalidatePath(`/projects/${task.projectId}`);
}

export async function removeLabel(taskId: string, labelId: string) {
	const session = await getSession();

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: { project: true },
	});

	if (!task) {
		throw new Error("Task not found");
	}

	if (task.project.ownerId !== session.user.id && session.user.role !== Role.DEVELOPER) {
		throw new Error("Unauthorized");
	}

	await prisma.task.update({
		where: { id: taskId },
		data: {
			labels: {
				disconnect: { id: labelId },
			},
		},
	});

	revalidatePath(`/projects/${task.projectId}`);
}
