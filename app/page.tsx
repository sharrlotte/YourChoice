export const dynamic = "force-dynamic";

import { auth, authConfigError, signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getErrorMessage, logServerError } from "@/lib/logger";
import { redirect } from "next/navigation";

export default async function Home() {
  let session = null;
  let sessionWarning: string | null = null;

  if (authConfigError) {
    sessionWarning =
      "Authentication is not configured yet. Add the required AUTH_* variables in Vercel project settings.";
  }

  if (!sessionWarning) {
    try {
      session = await auth();
    } catch (error) {
      logServerError("home.auth", error);
      sessionWarning =
        "We could not load your session right now. You can still try signing in again.";
    }
  }

  return (
    <main className="container mx-auto max-w-3xl px-6 py-20">
      <div className="space-y-6 rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
        <h1 className="text-3xl font-bold">Next.js Full Setup ✅</h1>
        <p className="text-muted-foreground">
          This project includes Next.js, Prisma, Google Auth (NextAuth), env setup,
          shadcn/ui, React Query, and TailwindCSS.
        </p>

        <div className="rounded-md bg-muted p-4 text-sm">
          <p>
            <span className="font-semibold">Session status:</span>{" "}
            {session?.user ? `Signed in as ${session.user.email}` : "Not signed in"}
          </p>
          {sessionWarning ? (
            <p className="mt-2 text-destructive">{sessionWarning}</p>
          ) : null}
        </div>

        <div className="flex gap-3">
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                try {
                  await signOut({ redirectTo: "/" });
                } catch (error) {
                  logServerError("home.signOut", error);
                  const message = getErrorMessage(error);
                  redirect(
                    `/auth/error?error=SIGNOUT_FAILED&message=${encodeURIComponent(message)}`,
                  );
                }
              }}
            >
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                try {
                  await signIn("google", { redirectTo: "/" });
                } catch (error) {
                  logServerError("home.signIn", error);
                  const message = getErrorMessage(error);
                  redirect(
                    `/auth/error?error=SIGNIN_FAILED&message=${encodeURIComponent(message)}`,
                  );
                }
              }}
            >
              <Button type="submit">Sign in with Google</Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
