"use client";

import { getLabels } from "@/app/actions/labels";
import { createTask } from "@/app/actions/tasks";
import { LabelManager } from "@/components/board/LabelManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function CreateTaskForm({ projectId, canManageLabels }: { projectId: string; canManageLabels?: boolean }) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
	const [openCombobox, setOpenCombobox] = useState(false);
	const { data: session } = useSession();
	const queryClient = useQueryClient();

	const { data: labels } = useQuery({
		queryKey: ["labels", projectId],
		queryFn: () => getLabels(projectId),
	});

	const { mutate: createTaskMutation, isPending } = useMutation({
		mutationFn: async (formData: FormData) => {
			selectedLabels.forEach((label) => {
				formData.append("labels", label.id);
			});
			return await createTask(projectId, formData);
		},
		onMutate: async (formData) => {
			await queryClient.cancelQueries({
				queryKey: ["tasks", projectId, "PENDING_SUGGESTION", "index"],
			});

			const previousTasks = queryClient.getQueryData(["tasks", projectId, "PENDING_SUGGESTION", "index"]);

			const title = formData.get("title") as string;
			const description = formData.get("description") as string;

			const newTask = {
				id: "temp-" + Date.now(),
				title,
				description,
				projectId,
				authorId: session?.user?.id || "temp",
				status: "PENDING_SUGGESTION",
				index: -1000,
				author: {
					id: session?.user?.id || "temp",
					name: session?.user?.name || "Me",
					image: session?.user?.image || null,
				},
				labels: selectedLabels,
				_count: { votes: 0, comments: 0 },
				votes: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			queryClient.setQueryData(["tasks", projectId, "PENDING_SUGGESTION", "index"], (oldData: any) => {
				if (!oldData) return { pages: [[newTask]], pageParams: [1] };
				const newPages = [...oldData.pages];
				if (newPages.length > 0) {
					newPages[0] = [newTask, ...newPages[0]];
				} else {
					newPages.push([newTask]);
				}
				return { ...oldData, pages: newPages };
			});

			return { previousTasks };
		},
		onError: (err, newTodo, context) => {
			queryClient.setQueryData(["tasks", projectId, "PENDING_SUGGESTION", "index"], context?.previousTasks);
			console.error("Failed to create task:", err);
			toast.error("Failed to create task");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
		},
		onSuccess: () => {
			setIsOpen(false);
			setSelectedLabels([]);
			toast.success("Task created");
		},
	});

	const handleSubmit = (formData: FormData) => {
		createTaskMutation(formData);
	};

	const toggleLabel = (label: Label) => {
		setSelectedLabels((prev) => (prev.some((l) => l.id === label.id) ? prev.filter((l) => l.id !== label.id) : [...prev, label]));
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button className="w-full">+ New Task</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] overflow-visible">
				<DialogHeader>
					<div className="flex items-center justify-between pr-8">
						<DialogTitle>New Task</DialogTitle>
						{canManageLabels && <LabelManager projectId={projectId} />}
					</div>
				</DialogHeader>
				<form action={handleSubmit} className="space-y-4 mt-4">
					<Input name="title" placeholder="Task Title" required />
					<Textarea name="description" placeholder="Description (optional)" className="h-32" />

					<div className="flex flex-wrap gap-2 items-center">
						{selectedLabels.map((label) => (
							<Badge
								key={label.id}
								variant="secondary"
								style={{ backgroundColor: label.color, color: "#fff" }}
								className="gap-1 pr-1 h-6 text-xs font-normal"
							>
								{label.name}
								<button type="button" onClick={() => toggleLabel(label)} className="hover:bg-black/20 rounded-full p-0.5">
									<X size={10} />
								</button>
							</Badge>
						))}

						<Popover open={openCombobox} onOpenChange={setOpenCombobox}>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm" role="combobox" aria-expanded={openCombobox} className="h-6 text-xs">
									<Plus size={12} className="mr-1" />
									Add Label
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[200px] p-0" align="start">
								<Command>
									<CommandInput placeholder="Search label..." />
									<CommandList>
										<CommandEmpty>No label found.</CommandEmpty>
										<CommandGroup>
											{labels?.map((label) => (
												<CommandItem
													key={label.id}
													value={label.name}
													onSelect={() => {
														toggleLabel(label);
													}}
												>
													<div className="flex items-center gap-2 w-full">
														<div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
														<span className="truncate">{label.name}</span>
														{selectedLabels.some((l) => l.id === label.id) && (
															<Check className="ml-auto h-4 w-4 opacity-100" />
														)}
													</div>
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>

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
