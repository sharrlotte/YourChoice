"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formatErrorMessage, isRedirectError } from "@/lib/errors";
import { logServerError } from "@/lib/logger";

const updateProjectSchema = z.object({
	id: z.string().min(1, "Project ID is required"),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

export async function updateProject(formData: FormData) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { error: "Unauthorized: Please sign in" };
		}

		const rawData = {
			id: formData.get("id"),
			name: formData.get("name"),
			description: formData.get("description"),
		};

		const validatedData = updateProjectSchema.safeParse(rawData);

		if (!validatedData.success) {
			return { error: z.prettifyError(validatedData.error) };
		}

		const { id, name, description } = validatedData.data;

		const project = await prisma.project.findUnique({
			where: { id },
		});

		if (!project) {
			return { error: "Project not found" };
		}

		if (project.ownerId !== session.user.id && session.user.role !== "DEVELOPER") {
			return { error: "Unauthorized: You do not have permission to update this project" };
		}

		await prisma.project.update({
			where: { id },
			data: {
				name: name.trim(),
				description: description?.trim() || null,
			},
		});

		revalidatePath(`/projects/${id}`);
		return { success: "Project updated successfully" };
	} catch (error) {
		if (isRedirectError(error)) throw error;
		logServerError("updateProject", error);
		return { error: formatErrorMessage(error, "Failed to update project") };
	}
}

export async function deleteProject(formData: FormData) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { error: "Unauthorized: Please sign in" };
		}

		const id = formData.get("id") as string;

		if (!id) {
			return { error: "Project ID is required" };
		}

		const project = await prisma.project.findUnique({
			where: { id },
		});

		if (!project) {
			return { error: "Project not found" };
		}

		if (project.ownerId !== session.user.id && session.user.role !== "DEVELOPER") {
			return { error: "Unauthorized: You do not have permission to delete this project" };
		}

		await prisma.project.delete({
			where: { id },
		});

		revalidatePath("/projects");
		redirect("/projects");
	} catch (error) {
		if (isRedirectError(error)) throw error;
		logServerError("deleteProject", error);
		return { error: formatErrorMessage(error, "Failed to delete project") };
	}
}

