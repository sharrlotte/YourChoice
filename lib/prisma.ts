import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

const globalForPrisma = global as unknown as {
	prisma: PrismaClient;
};

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

function createPrisma() {
	const base = new PrismaClient({ adapter });

	const extended = base.$extends({
		query: {
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					const start = performance.now();
					const result = await query(args);
					const duration = performance.now() - start;

					if (duration > env.SLOW_QUERY_THRESHOLD_MS) {
						const logData: Record<string, unknown> = {
							model,
							action: operation,
							duration: `${duration.toFixed(1)}ms`,
						};
						if (process.env.NODE_ENV !== "production") {
							logData.args = args;
						}
						console.warn(`[Slow Query]`, JSON.stringify(logData));
					} else if (process.env.NODE_ENV !== "production") {
						console.log(
							`[Prisma] ${model}.${operation} ${duration.toFixed(1)}ms`
						);
					}

					return result;
				},
			},
		},
	});

	return extended as unknown as PrismaClient;
}

const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
