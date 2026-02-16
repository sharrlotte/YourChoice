import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const adapter: Adapter | undefined = prisma
  ? (PrismaAdapter(prisma) as Adapter)
  : undefined;

const nextAuthInstance = (() => {
  try {
    return NextAuth({
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
    });
  } catch {
    return null;
  }
})();

export const handlers = nextAuthInstance?.handlers;
export const signIn =
  nextAuthInstance?.signIn ??
  (async () => {
    throw new Error("Authentication is not configured.");
  });
export const signOut =
  nextAuthInstance?.signOut ??
  (async () => {
    throw new Error("Authentication is not configured.");
  });
export const auth = nextAuthInstance?.auth ?? (async () => null);
