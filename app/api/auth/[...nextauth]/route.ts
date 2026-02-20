import { toNextJsHandler } from "better-auth/next-js";
import { auth, authConfigError } from "@/lib/auth";

const authNotConfigured = () =>
  Response.json(
    {
      error: "Authentication is not configured.",
      code: authConfigError?.code ?? "AUTH_NOT_CONFIGURED",
      details: authConfigError?.details ?? [],
      message: authConfigError?.message ?? "Unknown authentication configuration error.",
    },
    {
      status: 500,
    },
  );

const handler = auth ? toNextJsHandler(auth) : null;

export const GET = handler?.GET ?? authNotConfigured;
export const POST = handler?.POST ?? authNotConfigured;
export const PATCH = handler?.PATCH ?? authNotConfigured;
export const PUT = handler?.PUT ?? authNotConfigured;
export const DELETE = handler?.DELETE ?? authNotConfigured;
