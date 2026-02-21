export const dynamic = "force-dynamic";

import { createProject } from "@/app/actions/projects";
import { ProjectCard } from "@/components/board/ProjectCard";
import { CreateProjectDialog } from "@/components/board/CreateProjectDialog";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { auth, signIn } from "@/lib/auth";
import { getErrorMessage, logServerError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { GITHUB_REPO_URL, DISCORD_INVITE_URL } from "@/lib/constants";
import { GithubIcon, DiscordIcon } from "@/components/icons";

function isRedirectError(error: unknown) {
	return typeof error === "object" && error !== null && (error as Error).message === "NEXT_REDIRECT";
}

export default async function Home() {
	const session = await auth();
	const projects = await prisma.project.findMany({
		orderBy: { createdAt: "desc" },
		include: {
			_count: { select: { tasks: true } },
			owner: true,
		},
	});

	return (
		<div className="min-h-screen bg-background flex flex-col">
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
						<form
							action={async () => {
								"use server";
								try {
									await signIn("google", { redirectTo: "/" });
								} catch (error) {
									if (isRedirectError(error)) throw error;
									logServerError("home.signIn", error);
									const message = getErrorMessage(error);
									redirect(`/auth/error?error=SIGNIN_FAILED&message=${encodeURIComponent(message)}`);
								}
							}}
						>
							<Button type="submit" size="sm">
								Sign in with Google
							</Button>
						</form>
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

			<footer className="border-t py-6 md:py-0">
				<div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
					<p className="text-sm text-muted-foreground text-center md:text-left">
						© {new Date().getFullYear()} YourChoice. All rights reserved.
					</p>
					<div className="flex items-center gap-6">
						<a
							href={GITHUB_REPO_URL}
							target="_blank"
							rel="noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<GithubIcon className="h-5 w-5" />
							<span className="sr-only">GitHub</span>
						</a>
						<a
							href={DISCORD_INVITE_URL}
							target="_blank"
							rel="noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<DiscordIcon className="h-5 w-5" />
							<span className="sr-only">Discord</span>
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
