import { authConfigError, handlers } from "@/lib/auth";

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

export const GET = handlers?.GET ?? authNotConfigured;
export const POST = handlers?.POST ?? authNotConfigured;
