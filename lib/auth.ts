import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { getAuthEnvOrThrow, getMissingAuthEnvVars } from "@/lib/env";
import { logServerError } from "@/lib/logger";

type AuthSetupError = {
  code: "AUTH_CONFIGURATION_ERROR";
  message: string;
  details: string[];
};

type AuthSetupResult =
  | {
      status: "ready";
      instance: ReturnType<typeof betterAuth>;
    }
  | {
      status: "error";
      error: AuthSetupError;
    };

function buildAuthSetupError(cause: unknown, details: string[] = []): AuthSetupError {
  const message =
    cause instanceof Error
      ? cause.message
      : "Authentication is not configured correctly.";

  return {
    code: "AUTH_CONFIGURATION_ERROR",
    message,
    details,
  };
}

function initAuth(): AuthSetupResult {
  const missingAuthEnvVars = getMissingAuthEnvVars();

  if (missingAuthEnvVars.length > 0) {
    const error = buildAuthSetupError(
      new Error("Missing required authentication environment variables."),
      missingAuthEnvVars,
    );

    logServerError(
      "auth.init.missing_env",
      error,
      { missingAuthEnvVars },
      { onceKey: `auth.init.missing_env:${missingAuthEnvVars.join(",")}` },
    );

    return {
      status: "error",
      error,
    };
  }

  if (!prisma) {
    const error = buildAuthSetupError(
      new Error("DATABASE_URL is required for Better Auth with Prisma."),
      ["DATABASE_URL"],
    );

    return {
      status: "error",
      error,
    };
  }

  try {
    const authEnv = getAuthEnvOrThrow();

    const instance = betterAuth({
      database: prismaAdapter(prisma, {
        provider: "postgresql",
      }),
      secret: authEnv.AUTH_SECRET,
      baseURL:
        process.env.BETTER_AUTH_URL ??
        process.env.AUTH_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000/api/auth",
      socialProviders: {
        google: {
          clientId: authEnv.AUTH_GOOGLE_ID,
          clientSecret: authEnv.AUTH_GOOGLE_SECRET,
        },
      },
    });

    return {
      status: "ready",
      instance,
    };
  } catch (error) {
    logServerError("auth.init.better_auth", error, {}, { onceKey: "auth.init.better_auth" });

    return {
      status: "error",
      error: buildAuthSetupError(error),
    };
  }
}

const authSetup = initAuth();

export const authConfigError = authSetup.status === "error" ? authSetup.error : null;

export const auth = authSetup.status === "ready" ? authSetup.instance : null;
