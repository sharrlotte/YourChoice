export const dynamic = "force-dynamic";

import { createProject } from "@/app/actions/projects";
import { ProjectCard } from "@/components/board/ProjectCard";
import { CreateProjectDialog } from "@/components/board/CreateProjectDialog";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getErrorMessage, logServerError } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { SignInButton } from "@/components/auth/SignInButton";
import { Footer } from "@/components/layout/Footer";

function isRedirectError(error: unknown) {
	return typeof error === "object" && error !== null && (error as Error).message === "NEXT_REDIRECT";
}

export default async function Home() {
	const session = await getSession();
	const projects = await prisma.project.findMany({
		orderBy: { createdAt: "desc" },
		include: {
			_count: { select: { tasks: true } },
			owner: true,
		},
	});

	return (
		<div className="h-screen overflow-y-scroll no-scrollbar bg-background">
			<div className="min-h-screen flex flex-col">
				<header className="border-b bg-card px-6 h-14 flex justify-between items-center shadow-sm sticky top-0 z-10">
					<div className="flex items-center gap-2">
						<LayoutGrid className="h-5 w-5 text-primary" />
					</div>

					{session?.user ? (
						<div className="flex items-center gap-4">
							<ThemeToggle />
							<UserMenu />
						</div>
					) : (
						<div className="flex items-center gap-4">
							<ThemeToggle />
							<SignInButton />
						</div>
					)}
				</header>

				<main className="flex-1 container mx-auto py-6 px-4">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
						<div>
							<h2 className="text-2xl font-bold text-foreground">All Projects</h2>
							<p className="text-sm text-muted-foreground mt-1">Explore projects created by the community.</p>
						</div>

						{session?.user && <CreateProjectDialog />}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{projects.map((project) => (
							<ProjectCard key={project.id} project={project} currentUserId={session?.user?.id} />
						))}
						{projects.length === 0 && (
							<div className="col-span-full text-center py-12 bg-muted/20 rounded-lg border border-dashed">
								<h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
								<p className="text-muted-foreground mb-4">Be the first to create a project!</p>
								{!session?.user && <p className="text-sm text-muted-foreground">Sign in to get started.</p>}
							</div>
						)}
					</div>
				</main>
			</div>
			<Footer />
		</div>
	);
}
