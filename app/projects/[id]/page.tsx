import { KanbanBoard } from "@/components/board/KanbanBoard";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import prisma from "@/lib/prisma";
import { Role } from "@/app/generated/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CircleQuestionMark, LayoutGrid, Settings } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

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
		<div className="overflow-y-scroll no-scrollbar">
			<div className="h-dvh flex flex-col overflow-hidden">
				<header className="bg-card/20 border-b px-6 py-4 flex items-center shadow-sm gap-2 h-16">
					<LayoutGrid className="h-5 w-5 text-primary" />
					<div className="flex items-center gap-4 ml-auto">
						<ThemeToggle />
						<UserMenu />
					</div>
				</header>
				<div className="flex flex-1 flex-col px-6 py-4 overflow-hidden">
					<div className="flex h-full overflow-hidden">
						<div>
							<h1 className="text-xl font-bold text-foreground">{project.name}</h1>
							<p className="text-sm text-muted-foreground max-w-xl truncate">{project.description}</p>
						</div>
						<div className="ml-auto">
							<Button variant="ghost" size="icon">
								<CircleQuestionMark className="size-5" />
							</Button>
							{canManageLabels && (
								<Link href={`/projects/${project.id}/settings`}>
									<Button variant="ghost" size="icon">
										<Settings className="size-5" />
									</Button>
								</Link>
							)}
						</div>
					</div>
					<KanbanBoard projectId={project.id} canManageLabels={canManageLabels} />
				</div>
			</div>
			<Footer />
		</div>
	);
}
