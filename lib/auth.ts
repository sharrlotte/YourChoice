import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { env, getMissingAuthEnvVars } from "@/lib/env";

type AuthSetupError = {
  code: "AUTH_CONFIGURATION_ERROR";
  message: string;
  details: string[];
};

type AuthSetupResult =
  | {
      status: "ready";
      instance: ReturnType<typeof NextAuth>;
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
    return {
      status: "error",
      error: buildAuthSetupError(
        new Error("Missing required authentication environment variables."),
        missingAuthEnvVars,
      ),
    };
  }

  const adapter: Adapter | undefined = prisma
    ? (PrismaAdapter(prisma) as Adapter)
    : undefined;

  try {
    const instance = NextAuth({
      adapter,
      providers: [
        Google({
          clientId: env.AUTH_GOOGLE_ID,
          clientSecret: env.AUTH_GOOGLE_SECRET,
        }),
      ],
      secret: env.AUTH_SECRET,
      session: {
        strategy: adapter ? "database" : "jwt",
      },
      pages: {
        error: "/auth/error",
      },
    });

    return {
      status: "ready",
      instance,
    };
  } catch (error) {
    return {
      status: "error",
      error: buildAuthSetupError(error),
    };
  }
}

const authSetup = initAuth();

export const authConfigError =
  authSetup.status === "error" ? authSetup.error : null;

const throwAuthConfigurationError = async () => {
  throw new Error(
    authConfigError
      ? `${authConfigError.message} Details: ${authConfigError.details.join(", ") || "none"}`
      : "Authentication is not configured.",
  );
};

export const handlers =
  authSetup.status === "ready" ? authSetup.instance.handlers : undefined;

export const signIn =
  authSetup.status === "ready"
    ? authSetup.instance.signIn
    : throwAuthConfigurationError;

export const signOut =
  authSetup.status === "ready"
    ? authSetup.instance.signOut
    : throwAuthConfigurationError;

export const auth =
  authSetup.status === "ready" ? authSetup.instance.auth : throwAuthConfigurationError;
