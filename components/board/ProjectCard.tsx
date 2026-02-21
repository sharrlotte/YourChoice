"use client";

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project, User } from "@prisma/client";
import Link from "next/link";

interface ProjectCardProps {
	project: Project & { owner: User; _count: { tasks: number } };
	currentUserId?: string;
}

export function ProjectCard({ project }: ProjectCardProps) {
	return (
		<Link href={`/projects/${project.id}`} className="group relative h-full">
			<Card className="h-full hover:shadow-md transition-shadow">
				<CardHeader className="p-4 pb-2">
					<div className="flex justify-between items-start">
						<CardTitle className="text-lg truncate pr-2 font-semibold tracking-tight">{project.name}</CardTitle>
					</div>
					<CardDescription className="line-clamp-2 text-xs text-muted-foreground/80 mt-1">{project.description}</CardDescription>
				</CardHeader>
				<div className="flex-1" />
				<CardFooter className="flex justify-between items-center p-4 pt-0">
					<div className="flex items-center gap-2">
						<Avatar className="h-5 w-5">
							<AvatarImage src={project.owner.image || ""} />
							<AvatarFallback className="text-[10px]">{project.owner.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
						</Avatar>
						<span className="text-xs font-medium text-muted-foreground">{project.owner.name || "Unknown"}</span>
					</div>
					<span className="text-[10px] text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</span>
				</CardFooter>
			</Card>
		</Link>
	);
}
