"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const isProduction = process.env.NODE_ENV === "production";

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[ui-error-boundary]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <main className="container mx-auto max-w-2xl px-6 py-20">
      <div className="space-y-4 rounded-lg border border-destructive/30 bg-card p-8 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-bold text-destructive">Application Error</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred while rendering this page.
        </p>
        <div className="rounded-md bg-muted p-4 text-sm space-y-2">
          {error.message && error.message !== "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive information." ? (
            <p>
              <span className="font-semibold">Details:</span> {error.message}
            </p>
          ) : (
            <p className="text-muted-foreground">
              A server-side error occurred. If this persists, please check your network connection or try again later.
            </p>
          )}
          {error.digest ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Reference ID:</span> {error.digest}
            </p>
          ) : null}
          {!isProduction && error.stack ? (
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-black/10 p-2 text-xs font-mono">
              {error.stack}
            </pre>
          ) : null}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            onClick={() => reset()}
            type="button"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

