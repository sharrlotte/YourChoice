"use client";

import { assignLabel, removeLabel, getLabels } from "@/app/actions/labels";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label as PrismaLabel } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Tag } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface LabelSelectorProps {
  taskId: string;
  projectId: string;
  assignedLabels: PrismaLabel[];
}

export function LabelSelector({ taskId, projectId, assignedLabels }: LabelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const { data: allLabels } = useQuery({
    queryKey: ["labels", projectId],
    queryFn: () => getLabels(projectId),
  });

  const isAssigned = (labelId: string) => {
    return assignedLabels.some((l) => l.id === labelId);
  };

  const handleToggleLabel = (label: PrismaLabel) => {
    startTransition(async () => {
      try {
        if (isAssigned(label.id)) {
          await removeLabel(taskId, label.id);
          toast.success("Label removed");
        } else {
          await assignLabel(taskId, label.id);
          toast.success("Label added");
        }
        queryClient.invalidateQueries({ queryKey: ["task", taskId] });
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      } catch (error) {
        toast.error("Failed to update label");
      }
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Tag size={14} className="mr-1" />
          Labels
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm px-1">Assign Labels</h4>
          <div className="grid gap-1">
            {allLabels?.map((label) => {
              const assigned = isAssigned(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => handleToggleLabel(label)}
                  disabled={isPending}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span>{label.name}</span>
                  </div>
                  {assigned && <Check size={14} className="text-primary" />}
                </button>
              );
            })}
            {allLabels?.length === 0 && (
              <span className="text-xs text-muted-foreground px-2 py-2">
                No labels found. Create some in project settings.
              </span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
