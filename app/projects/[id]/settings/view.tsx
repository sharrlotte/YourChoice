"use client";

import { Project } from "@/app/generated/prisma";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { updateProject, deleteProject } from "@/app/actions/project";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LayoutGrid, Settings, Trash2, Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SettingsViewProps {
	project: Project;
}

type Tab = "general" | "integration";

export function SettingsView({ project }: SettingsViewProps) {
	const [activeTab, setActiveTab] = useState<Tab>("general");
	const [isPending, startTransition] = useTransition();

	const handleUpdate = async (formData: FormData) => {
		startTransition(async () => {
			const result = await updateProject(formData);
			if (result.error) {
				toast.error(result.error);
			} else {
				toast.success("Project updated successfully");
			}
		});
	};

	const handleDelete = async () => {
		const formData = new FormData();
		formData.append("id", project.id);

		const result = await deleteProject(formData);
		if (result?.error) {
			toast.error(result.error);
		}
	};

	return (
		<div className="flex flex-col h-full bg-background">
			<header className="bg-card/20 border-b px-6 py-4 flex items-center shadow-sm gap-2">
				<Link href={`/projects/${project.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
					<LayoutGrid className="h-5 w-5 text-primary" />
					<span className="font-semibold">{project.name}</span>
				</Link>
				<span className="text-muted-foreground">/</span>
				<span className="text-muted-foreground">Settings</span>
			</header>

			<main className="flex-1 container max-w-6xl mx-auto py-8 px-6">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-8">
					{/* Sidebar */}
					<aside className="md:col-span-3 lg:col-span-2">
						<nav className="flex flex-col gap-1">
							<Button
								variant={activeTab === "general" ? "secondary" : "ghost"}
								className="justify-start gap-2"
								onClick={() => setActiveTab("general")}
							>
								<Settings className="size-4" />
								General
							</Button>
							<Button
								variant={activeTab === "integration" ? "secondary" : "ghost"}
								className="justify-start gap-2"
								onClick={() => setActiveTab("integration")}
							>
								<Plug className="size-4" />
								Integrations
							</Button>
						</nav>
					</aside>

					{/* Content */}
					<div className="md:col-span-9 lg:col-span-10 space-y-6">
						{activeTab === "general" && (
							<div className="space-y-6">
								<div>
									<h2 className="text-lg font-medium">General Settings</h2>
									<p className="text-sm text-muted-foreground">Manage your project settings and preferences.</p>
								</div>
								<Separator />

								<form action={handleUpdate} className="space-y-4">
									<input type="hidden" name="id" value={project.id} />
									<div className="grid gap-2">
										<Label htmlFor="name">Project Name</Label>
										<Input id="name" name="name" defaultValue={project.name} placeholder="Project Name" required />
									</div>
									<div className="grid gap-2">
										<Label htmlFor="description">Description</Label>
										<Textarea
											id="description"
											name="description"
											defaultValue={project.description || ""}
											placeholder="Project Description"
											className="min-h-[100px]"
										/>
									</div>
									<div className="flex justify-end">
										<Button type="submit" disabled={isPending}>
											{isPending ? "Saving..." : "Save Changes"}
										</Button>
									</div>
								</form>

								<div className="pt-6">
									<Card className="border-destructive/20 bg-destructive/5">
										<CardHeader>
											<CardTitle className="text-destructive text-lg">Danger Zone</CardTitle>
											<CardDescription>
												Permanently delete your project and all of its contents. This action cannot be undone.
											</CardDescription>
										</CardHeader>
										<CardFooter className="flex justify-end border-t border-destructive/10 pt-6 bg-destructive/10">
											<Dialog>
												<DialogTrigger asChild>
													<Button variant="destructive">Delete Project</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Are you absolutely sure?</DialogTitle>
														<DialogDescription>
															This action cannot be undone. This will permanently delete the project
															<span className="font-semibold text-foreground"> {project.name} </span>
															and all associated tasks.
														</DialogDescription>
													</DialogHeader>
													<DialogFooter>
														<form action={handleDelete}>
															<Button variant="destructive" type="submit">
																Confirm Delete
															</Button>
														</form>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</CardFooter>
									</Card>
								</div>
							</div>
						)}

						{activeTab === "integration" && (
							<div className="space-y-6">
								<div>
									<h2 className="text-lg font-medium">Integrations</h2>
									<p className="text-sm text-muted-foreground">Connect your project with third-party services.</p>
								</div>
								<Separator />

								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<span className="size-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-bold">
												D
											</span>
											Discord Webhook
										</CardTitle>
										<CardDescription>
											Receive notifications in your Discord server when tasks are created or updated.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
											<div className="space-y-1">
												<p className="font-medium text-sm">Not configured</p>
												<p className="text-xs text-muted-foreground">Add a webhook URL to enable this integration.</p>
											</div>
											<Button variant="outline" size="sm" disabled>
												Configure
											</Button>
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
