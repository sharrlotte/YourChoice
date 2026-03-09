"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const updateProjectSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

export async function updateProject(formData: FormData) {
	const session = await getSession();
	if (!session) {
		return { error: "Unauthorized" };
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
		return { error: "Unauthorized" };
	}

	try {
		await prisma.project.update({
			where: { id },
			data: {
				name,
				description,
			},
		});
		revalidatePath(`/projects/${id}`);
		return { success: "Project updated successfully" };
	} catch (error) {
		return { error: "Failed to update project" };
	}
}

export async function deleteProject(formData: FormData) {
	const session = await getSession();
	if (!session) {
		return { error: "Unauthorized" };
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

	if (project.ownerId !== session.user.id) {
		return { error: "Unauthorized" };
	}

	try {
		await prisma.project.delete({
			where: { id },
		});
	} catch (error) {
		return { error: "Failed to delete project" };
	}

	redirect("/projects");
}
