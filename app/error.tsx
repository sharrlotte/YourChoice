"use client";

import { useEffect } from "react";

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
        <h1 className="text-2xl font-bold text-destructive">Server Error</h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong while rendering this page.
        </p>
        <div className="rounded-md bg-muted p-4 text-sm">
          {isProduction ? (
            <p>
              <span className="font-semibold">Reference:</span> {error.digest ?? "N/A"}
            </p>
          ) : (
            <>
              <p>
                <span className="font-semibold">Message:</span> {error.message}
              </p>
              {error.digest ? (
                <p className="mt-2">
                  <span className="font-semibold">Digest:</span> {error.digest}
                </p>
              ) : null}
            </>
          )}
        </div>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
          onClick={() => reset()}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
