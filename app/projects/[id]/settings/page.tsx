import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { SettingsView } from "./view";
import { Metadata } from "next";

interface PageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { id } = await params;
	const project = await prisma.project.findUnique({
		where: { id },
		select: { name: true },
	});

	return {
		title: project ? `${project.name} - Settings` : "Project Settings",
	};
}

export default async function ProjectSettingsPage({ params }: PageProps) {
	const { id } = await params;
	const session = await getSession();

	if (!session) {
		redirect("/");
	}

	const project = await prisma.project.findUnique({
		where: { id },
	});

	if (!project) {
		notFound();
	}

	const isDeveloper = session.user.role === "DEVELOPER";
	const isOwner = project.ownerId === session.user.id;

	if (!isDeveloper && !isOwner) {
		redirect(`/projects/${id}`);
	}

	return <SettingsView project={project} />;
}
