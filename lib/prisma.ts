import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL is set (via lib/env side effect of accessing env.DATABASE_URL,
// though importing it might not be enough if it's an object property unless we access it.
// Actually env.DATABASE_URL calls required() immediately when the object is defined?
// No, it calls required() at definition time. So just importing it is enough.)
// But let's be explicit.
const _ = env.DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}
