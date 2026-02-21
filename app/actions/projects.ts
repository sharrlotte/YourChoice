"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    throw new Error("Name is required");
  }

  await prisma.project.create({
    data: {
      name,
      description,
      ownerId: session.user.id,
    },
  });

  revalidatePath("/");
  redirect("/");
}

export async function updateProject(id: string, formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
     throw new Error("Unauthorized");
  }

  // Allow project owner to update
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new Error("Project not found");
  
  if (project.ownerId !== session.user.id && session.user.role !== Role.DEVELOPER) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    throw new Error("Name is required");
  }

  await prisma.project.update({
    where: { id },
    data: {
      name,
      description,
    },
  });

  revalidatePath("/");
}

export async function deleteProject(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  
  // Allow project owner to delete
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new Error("Project not found");
  
  if (project.ownerId !== session.user.id && session.user.role !== Role.DEVELOPER) {
    throw new Error("Unauthorized");
  }

  await prisma.project.delete({
    where: { id },
  });

  revalidatePath("/");
}
