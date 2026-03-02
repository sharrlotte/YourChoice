import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center space-y-4 bg-background">
      <div className="flex flex-col items-center space-y-2 text-center px-4">
        <div className="rounded-full bg-muted p-4 mb-2">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Project Not Found
        </h1>
        <p className="text-muted-foreground max-w-[500px]">
          The project you are looking for does not exist, has been removed, or you
          do not have permission to view it.
        </p>
      </div>
      <Button asChild variant="default">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
      </Button>
    </div>
  );
}
