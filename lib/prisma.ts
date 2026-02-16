import type { PrismaClient } from "@prisma/client";

type GlobalForPrisma = {
  prisma: PrismaClient | null | undefined;
};

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

function createPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const { PrismaClient } = require("@prisma/client") as {
      PrismaClient: new (options?: { log?: string[] }) => PrismaClient;
    };

    return new PrismaClient({
      log: ["error", "warn"],
    });
  } catch {
    return null;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
