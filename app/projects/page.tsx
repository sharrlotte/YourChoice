import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import Link from "next/link";

export default async function ProjectsPage() {
	const session = await auth();
	const projects = await prisma.project.findMany({
		orderBy: { createdAt: "desc" },
		include: { _count: { select: { tasks: true } } },
	});

	const isDeveloper = session?.user?.role === Role.DEVELOPER;

	return (
		<div className="container mx-auto py-10 px-4">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold text-foreground">Projects</h1>
				{isDeveloper && (
					<form action={createProject} className="flex gap-2">
						<Input name="name" placeholder="Project Name" required className="w-40" />
						<Input name="description" placeholder="Description" className="w-60" />
						<Button type="submit">Create Project</Button>
					</form>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{projects.map((project) => (
					<Link key={project.id} href={`/projects/${project.id}`} className="block group">
						<Card className="h-full hover:shadow-md transition-shadow group-hover:border-primary/50">
							<CardHeader>
								<CardTitle className="text-xl">{project.name}</CardTitle>
								<CardDescription className="line-clamp-2 h-10">{project.description || "No description"}</CardDescription>
							</CardHeader>
							<CardFooter className="flex justify-between text-sm text-muted-foreground">
								<span>{project._count.tasks} tasks</span>
								<span>{new Date(project.createdAt).toLocaleDateString()}</span>
							</CardFooter>
						</Card>
					</Link>
				))}
				{projects.length === 0 && (
					<p className="col-span-full text-center text-muted-foreground py-10">
						No projects found. {isDeveloper ? "Create one above." : "Ask a developer to create one."}
					</p>
				)}
			</div>
		</div>
	);
}
