import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { SettingsView } from "./view";
import { Metadata } from "next";

import { logServerError } from "@/lib/logger";

interface PageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	try {
		const { id } = await params;
		const project = await prisma.project.findUnique({
			where: { id },
			select: { name: true },
		});

		return {
			title: project ? `${project.name} - Settings` : "Project Settings",
		};
	} catch (error) {
		logServerError("ProjectSettingsPage.generateMetadata", error);
		return {
			title: "Project Settings",
		};
	}
}

export default async function ProjectSettingsPage({ params }: PageProps) {
	const { id } = await params;
	let session = null;
	try {
		session = await getSession();
	} catch (error) {
		logServerError("ProjectSettingsPage.getSession", error);
	}

	if (!session) {
		redirect("/");
	}

	let project = null;
	try {
		project = await prisma.project.findUnique({
			where: { id },
		});
	} catch (error) {
		logServerError("ProjectSettingsPage.findUnique", error, { id });
	}

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
