export const dynamic = "force-dynamic";

import { createProject } from "@/app/actions/projects";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, signIn } from "@/lib/auth";
import { getErrorMessage, logServerError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

function isRedirectError(error: unknown) {
  return typeof error === "object" && error !== null && (error as Error).message === "NEXT_REDIRECT";
}

export default async function Home() {
  let session;
  let projects = [];

  try {
    session = await auth();
    projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        _count: { select: { tasks: true } },
        owner: true 
      },
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logServerError("home.auth", error);
    // Don't redirect on error, just show empty state or error message if needed
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <h1 className="text-xl font-bold text-foreground">YourChoice</h1>
        </div>
        
        {session?.user ? (
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        ) : (
          <form
            action={async () => {
              "use server";
              try {
                await signIn("google", { redirectTo: "/" });
              } catch (error) {
                if (isRedirectError(error)) throw error;
                logServerError("home.signIn", error);
                const message = getErrorMessage(error);
                redirect(`/auth/error?error=SIGNIN_FAILED&message=${encodeURIComponent(message)}`);
              }
            }}
          >
            <Button type="submit" size="sm">Sign in with Google</Button>
          </form>
        )}
      </header>

      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">All Projects</h2>
            <p className="text-muted-foreground mt-1">
              Explore projects created by the community.
            </p>
          </div>
          
          {session?.user && (
            <form action={createProject} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Input
                name="name"
                placeholder="New Project Name"
                required
                className="w-full sm:w-40"
              />
              <Input
                name="description"
                placeholder="Description"
                className="w-full sm:w-60"
              />
              <Button type="submit">Create Project</Button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block group"
            >
              <Card className="h-full hover:shadow-md transition-shadow group-hover:border-primary/50 flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                     <CardTitle className="text-xl truncate pr-2">{project.name}</CardTitle>
                     {/* Maybe status or something? */}
                  </div>
                  <CardDescription className="line-clamp-2 h-10">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <div className="flex-1" />
                <CardFooter className="flex flex-col gap-2 items-start border-t pt-4 bg-muted/10">
                   <div className="flex justify-between w-full text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {project.owner.name || "Unknown"}
                      </span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                   </div>
                   <div className="text-xs text-muted-foreground">
                      {project._count.tasks} tasks
                   </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-lg border border-dashed">
              <h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create a project!
              </p>
              {!session?.user && (
                 <p className="text-sm text-muted-foreground">Sign in to get started.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
