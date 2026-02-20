import NextAuth from "next-auth";
import type { Session } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
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
      instance: ReturnType<typeof NextAuth>;
    }
  | {
      status: "error";
      error: AuthSetupError;
    };

const FALLBACK_TEST_USER = {
  name: "Default Test User",
  email: "default-test-user@local.dev",
  image: null,
} as const;

export const authFallbackEnabled = process.env.NODE_ENV !== "production";

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

  const adapter: Adapter | undefined = prisma
    ? (PrismaAdapter(prisma) as Adapter)
    : undefined;

  try {
    const authEnv = getAuthEnvOrThrow();

    const instance = NextAuth({
      adapter,
      providers: [
        Google({
          clientId: authEnv.AUTH_GOOGLE_ID,
          clientSecret: authEnv.AUTH_GOOGLE_SECRET,
        }),
      ],
      secret: authEnv.AUTH_SECRET,
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
    logServerError("auth.init.nextauth", error, {}, { onceKey: "auth.init.nextauth" });

    return {
      status: "error",
      error: buildAuthSetupError(error),
    };
  }
}

const authSetup = initAuth();

export const authConfigError =
  authSetup.status === "error" ? authSetup.error : null;

const getFallbackSession = async (): Promise<Session> => {
  if (prisma) {
    try {
      await prisma.user.upsert({
        where: { email: FALLBACK_TEST_USER.email },
        update: {
          name: FALLBACK_TEST_USER.name,
          image: FALLBACK_TEST_USER.image,
        },
        create: {
          name: FALLBACK_TEST_USER.name,
          email: FALLBACK_TEST_USER.email,
          image: FALLBACK_TEST_USER.image,
        },
      });
    } catch (error) {
      logServerError("auth.fallback_user_upsert", error, {
        email: FALLBACK_TEST_USER.email,
      });
    }
  }

  return {
    user: {
      name: FALLBACK_TEST_USER.name,
      email: FALLBACK_TEST_USER.email,
      image: FALLBACK_TEST_USER.image,
    },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
  };
};

const throwAuthConfigurationError = async () => {
  const message = authConfigError
    ? `${authConfigError.message} Details: ${authConfigError.details.join(", ") || "none"}`
    : "Authentication is not configured.";

  const error = new Error(message);
  logServerError("auth.throw_config_error", error, { authConfigError });

  throw error;
};

export const handlers =
  authSetup.status === "ready" ? authSetup.instance.handlers : undefined;

export const signIn =
  authSetup.status === "ready"
    ? authSetup.instance.signIn
    : authFallbackEnabled
      ? async () => undefined
      : throwAuthConfigurationError;

export const signOut =
  authSetup.status === "ready"
    ? authSetup.instance.signOut
    : authFallbackEnabled
      ? async () => undefined
      : throwAuthConfigurationError;

export const auth =
  authSetup.status === "ready"
    ? authSetup.instance.auth
    : authFallbackEnabled
      ? getFallbackSession
      : throwAuthConfigurationError;
