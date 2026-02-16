import type { PrismaClient } from "@prisma/client";

type GlobalForPrisma = {
  prisma: PrismaClient | undefined;
};

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

function createPrismaClient(): PrismaClient {
  const moduleRef = require("@prisma/client") as {
    PrismaClient?: new (options?: { log?: string[] }) => PrismaClient;
  };

  if (!moduleRef.PrismaClient) {
    throw new Error("PrismaClient export is missing. Did you run `prisma generate`?");
  }

  return new moduleRef.PrismaClient({
    log: ["error", "warn"],
  });
}

function getPrismaClient(): PrismaClient | undefined {
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  return createPrismaClient();
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
