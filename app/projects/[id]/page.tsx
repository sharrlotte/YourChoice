import { KanbanBoard } from "@/components/board/KanbanBoard";
import { UserMenu } from "@/components/layout/UserMenu";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";

export default async function ProjectPage(props: PageProps<"/projects/[id]">) {
	const { id } = await props.params;

	const session = await auth();

	if (!session?.user) {
		return (
			<div className="container mx-auto py-20 text-center">
				<h1 className="text-2xl font-bold mb-4 text-foreground">Please sign in to view this project.</h1>
				<a href="/" className="text-primary hover:underline">
					Go home
				</a>
			</div>
		);
	}

	const project = await prisma.project.findUnique({
		where: { id },
	});

	if (!project) {
		notFound();
	}

	const isDeveloper = session.user.role === Role.DEVELOPER;
	const isOwner = project.ownerId === session.user.id;
	const canManageLabels = isDeveloper || isOwner;

	return (
		<div className="h-screen flex flex-col overflow-hidden bg-background">
			<header className="bg-card border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
				<div>
					<h1 className="text-xl font-bold text-foreground">{project.name}</h1>
					<p className="text-sm text-muted-foreground max-w-xl truncate">{project.description}</p>
				</div>
				<div className="flex items-center gap-4">
					<UserMenu />
				</div>
			</header>

			<main className="flex-1 overflow-hidden p-6 bg-muted/20">
				<KanbanBoard projectId={project.id} canManageLabels={canManageLabels} />
			</main>
		</div>
	);
}
