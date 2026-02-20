"use client";

import { createTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function CreateTaskForm({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        + New Task
      </Button>
    );
  }

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
    <div className="bg-card p-4 rounded-lg shadow mb-4 border max-w-md">
      <h3 className="font-semibold mb-2 text-card-foreground">New Task</h3>
      <form action={handleSubmit} className="space-y-3">
        <Input
          name="title"
          placeholder="Task Title"
          required
        />
        <Textarea
          name="description"
          placeholder="Description (optional)"
          className="h-20"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
