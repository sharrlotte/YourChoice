"use server";

import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatErrorMessage, isRedirectError } from "@/lib/errors";
import { logServerError } from "@/lib/logger";

export async function getProjects() {
	try {
		return await prisma.project.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				_count: { select: { tasks: true } },
				owner: true,
			},
		});
	} catch (error) {
		logServerError("getProjects", error);
		return [];
	}
}

export async function getProjectsSimple() {
	try {
		return await prisma.project.findMany({
			orderBy: { createdAt: "desc" },
			include: { _count: { select: { tasks: true } } },
		});
	} catch (error) {
		logServerError("getProjectsSimple", error);
		return [];
	}
}

export async function createProject(formData: FormData) {
	try {
		const session = await getSession();

		if (!session?.user) {
			throw new Error("Unauthorized: Please sign in to create a project");
		}

		const name = (formData.get("name") as string)?.trim();
		const description = (formData.get("description") as string)?.trim();

		if (!name) {
			throw new Error("Project name is required");
		}

		await prisma.project.create({
			data: {
				name,
				description: description || null,
				ownerId: session.user.id,
			},
		});

		revalidatePath("/");
		redirect("/");
	} catch (error) {
		if (isRedirectError(error)) throw error;
		logServerError("createProject", error);
		throw new Error(formatErrorMessage(error, "Failed to create project"));
	}
}

export async function updateProject(id: string, formData: FormData) {
	try {
		const session = await getSession();

		if (!session?.user) {
			throw new Error("Unauthorized: Please sign in");
		}

		const project = await prisma.project.findUnique({ where: { id } });
		if (!project) throw new Error("Project not found");

		if (project.ownerId !== session.user.id && session.user.role !== Role.DEVELOPER) {
			throw new Error("Unauthorized: You do not have permission to update this project");
		}

		const name = (formData.get("name") as string)?.trim();
		const description = (formData.get("description") as string)?.trim();

		if (!name) {
			throw new Error("Project name is required");
		}

		await prisma.project.update({
			where: { id },
			data: {
				name,
				description: description || null,
			},
		});

		revalidatePath("/");
	} catch (error) {
		if (isRedirectError(error)) throw error;
		logServerError("updateProject", error);
		throw new Error(formatErrorMessage(error, "Failed to update project"));
	}
}

export async function deleteProject(id: string) {
	try {
		const session = await getSession();

		if (!session?.user) {
			throw new Error("Unauthorized: Please sign in");
		}

		const project = await prisma.project.findUnique({ where: { id } });
		if (!project) throw new Error("Project not found");

		if (project.ownerId !== session.user.id && session.user.role !== Role.DEVELOPER) {
			throw new Error("Unauthorized: You do not have permission to delete this project");
		}

		await prisma.project.delete({
			where: { id },
		});

		revalidatePath("/");
	} catch (error) {
		if (isRedirectError(error)) throw error;
		logServerError("deleteProject", error);
		throw new Error(formatErrorMessage(error, "Failed to delete project"));
	}
}

