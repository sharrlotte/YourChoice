"use client";

import { createTask } from "@/app/actions/tasks";
import { LabelManager } from "@/components/board/LabelManager";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function CreateTaskForm({ projectId, canManageLabels }: { projectId: string; canManageLabels?: boolean }) {
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (formData: FormData) => {
		startTransition(async () => {
			try {
				await createTask(projectId, formData);
				setIsOpen(false);
				toast.success("Task created");
			} catch (error) {
				console.error("Failed to create task:", error);
				toast.error("Failed to create task");
			}
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button className="w-full">+ New Task</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<div className="flex items-center justify-between pr-8">
						<DialogTitle>New Task</DialogTitle>
						{canManageLabels && <LabelManager projectId={projectId} />}
					</div>
				</DialogHeader>
				<form action={handleSubmit} className="space-y-4 mt-4">
					<Input name="title" placeholder="Task Title" required />
					<Textarea name="description" placeholder="Description (optional)" className="h-32" />
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
