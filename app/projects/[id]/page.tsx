import { KanbanBoard } from "@/components/board/KanbanBoard";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import prisma from "@/lib/prisma";
import { Role } from "@/app/generated/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Settings } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";

export async function generateMetadata(props: PageProps<"/projects/[id]">): Promise<Metadata> {
	const { id } = await props.params;

	const project = await prisma.project.findUnique({
		where: { id },
	});

	if (!project) {
		return {
			title: "Project Not Found",
		};
	}

	return {
		title: project.name,
		description: project.description,
		openGraph: {
			title: project.name,
			description: project.description ?? undefined,
			type: "website",
		},
	};
}

export default async function ProjectPage(props: PageProps<"/projects/[id]">) {
	const { id } = await props.params;

	const session = await getSession();

	const project = await prisma.project.findUnique({
		where: { id },
	});

	if (!project) {
		notFound();
	}

	const isDeveloper = session?.user.role === Role.DEVELOPER;
	const isOwner = project.ownerId === session?.user.id;
	const canManageLabels = isDeveloper || isOwner;

	return (
		<div className="h-dvh overflow-y-scroll no-scrollbar">
			<div className="flex flex-col h-full">
				<header className="bg-card border-b px-6 py-4 flex items-center shadow-sm gap-2">
					<LayoutGrid className="h-5 w-5 text-primary" />
					<div className="flex items-center gap-4 ml-auto">
						<ThemeToggle />
						<UserMenu />
					</div>
				</header>
				<main className="flex-1 flex flex-col overflow-hidden h-full px-6 py-4">
					<div className="flex">
						<div>
							<h1 className="text-xl font-bold text-foreground">{project.name}</h1>
							<p className="text-sm text-muted-foreground max-w-xl truncate">{project.description}</p>
						</div>
						<div className="ml-auto">
							<Button variant="ghost" size="icon">
								<Settings className="size-5" />
							</Button>
						</div>
					</div>
					<KanbanBoard projectId={project.id} canManageLabels={canManageLabels} />
				</main>
			</div>
			<Footer />
		</div>
	);
}
