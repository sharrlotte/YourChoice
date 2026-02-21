"use client";

import { createLabel, getLabels } from "@/app/actions/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface LabelManagerProps {
	projectId: string;
}

const PRESET_COLORS = [
	"#ef4444", // red-500
	"#f97316", // orange-500
	"#eab308", // yellow-500
	"#22c55e", // green-500
	"#06b6d4", // cyan-500
	"#3b82f6", // blue-500
	"#8b5cf6", // violet-500
	"#d946ef", // fuchsia-500
	"#ec4899", // pink-500
	"#64748b", // slate-500
];

export function LabelManager({ projectId }: LabelManagerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [newLabelName, setNewLabelName] = useState("");
	const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
	const [isPending, startTransition] = useTransition();
	const queryClient = useQueryClient();

	const { data: labels } = useQuery({
		queryKey: ["labels", projectId],
		queryFn: () => getLabels(projectId),
	});

	const handleCreate = () => {
		if (!newLabelName.trim()) return;

		startTransition(async () => {
			try {
				const formData = new FormData();
				formData.append("name", newLabelName);
				formData.append("color", selectedColor);
				await createLabel(projectId, formData);
				queryClient.invalidateQueries({ queryKey: ["labels", projectId] });
				toast.success("Label created");
				setNewLabelName("");
			} catch (error) {
				toast.error("Failed to create label");
			}
		});
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Settings2 size={14} />
					Manage Labels
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="space-y-4">
					<h4 className="font-medium leading-none">Project Labels</h4>

					<div className="flex flex-wrap gap-2">
						{labels?.map((label) => (
							<Badge key={label.id} variant="secondary" style={{ backgroundColor: label.color, color: "#fff" }}>
								{label.name}
							</Badge>
						))}
						{labels?.length === 0 && <span className="text-sm text-muted-foreground">No labels created yet.</span>}
					</div>

					<div className="space-y-2 border-t pt-4">
						<h5 className="text-sm font-medium">Create New Label</h5>
						<div className="grid gap-2">
							<Label htmlFor="name" className="text-xs">
								Name
							</Label>
							<Input
								id="name"
								className="h-8"
								value={newLabelName}
								onChange={(e) => setNewLabelName(e.target.value)}
								placeholder="e.g. Bug, Feature"
							/>
						</div>
						<div className="grid gap-2">
							<Label className="text-xs">Color</Label>
							<div className="flex flex-wrap gap-1">
								{PRESET_COLORS.map((color) => (
									<button
										key={color}
										className={`w-6 h-6 rounded-full border-2 transition-all ${
											selectedColor === color ? "border-foreground scale-110" : "border-transparent"
										}`}
										style={{ backgroundColor: color }}
										onClick={() => setSelectedColor(color)}
									/>
								))}
							</div>
						</div>
						<Button size="sm" className="w-full mt-2" onClick={handleCreate} disabled={isPending || !newLabelName.trim()}>
							{isPending ? "Creating..." : "Create Label"}
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
