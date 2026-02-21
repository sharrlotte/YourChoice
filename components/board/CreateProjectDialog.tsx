"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/app/actions/projects";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function CreateProjectDialog() {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (formData: FormData) => {
		startTransition(async () => {
			try {
				await createProject(formData);
				toast.success("Project created successfully");
				setOpen(false);
			} catch (error) {
				toast.error("Failed to create project");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<Plus className="mr-2 h-4 w-4" />
					Create Project
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<form action={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create Project</DialogTitle>
						<DialogDescription>Add a new project to your board.</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Name</Label>
							<Input id="name" name="name" placeholder="New Project Name" required />
						</div>
						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<Textarea id="description" name="description" placeholder="Description" />
						</div>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Creating..." : "Create Project"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
