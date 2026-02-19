import Link from "next/link";

type Props = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const params = await searchParams;
  const isProduction = process.env.NODE_ENV === "production";
  const details = isProduction ? null : params?.message;

  return (
    <main className="container mx-auto max-w-2xl px-6 py-20">
      <div className="space-y-4 rounded-lg border border-destructive/30 bg-card p-8 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
        <p className="text-sm text-muted-foreground">
          We could not complete your login request. Please check configuration and try
          again.
        </p>

        <div className="rounded-md bg-muted p-4 text-sm">
          <p>
            <span className="font-semibold">Error code:</span> {params?.error ?? "Unknown"}
          </p>
          {details ? (
            <p className="mt-2 break-words">
              <span className="font-semibold">Details:</span> {details}
            </p>
          ) : null}
        </div>

        <Link className="text-sm underline" href="/">
          Go back home
        </Link>
      </div>
    </main>
  );
}
