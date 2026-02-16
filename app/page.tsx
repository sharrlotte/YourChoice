export const dynamic = "force-dynamic";

import { auth, authConfigError, signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function Home() {
  if (authConfigError) {
    redirect(
      `/auth/error?error=${encodeURIComponent(
        authConfigError.code,
      )}&message=${encodeURIComponent(
        `${authConfigError.message} ${authConfigError.details.join(", ")}`.trim(),
      )}`,
    );
  }

  const session = await auth();

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
        </div>

        <div className="flex gap-3">
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                try {
                  await signOut({ redirectTo: "/" });
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : "Unexpected sign-out error.";
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
                  const message =
                    error instanceof Error ? error.message : "Unexpected sign-in error.";
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
