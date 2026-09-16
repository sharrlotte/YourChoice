import { PrismaClient } from "@/app/generated/prisma/wasm";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { env } from "./env";
import { logServerError } from "./logger";

const globalForPrisma = global as unknown as {
	prisma: PrismaClient;
};

// Enable HTTP fetch mode for edge environments (Cloudflare Workers) to prevent hanging WebSockets
neonConfig.poolQueryViaFetch = true;

if (typeof WebSocket === "undefined") {
	neonConfig.webSocketConstructor = ws;
}

const adapter = new PrismaNeon({
	connectionString: process.env.DATABASE_URL,
});

function createPrisma() {
	const base = new PrismaClient({ adapter });

	const extended = base.$extends({
		query: {
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					const start = performance.now();
					try {
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
					} catch (error) {
						const duration = performance.now() - start;
						logServerError(`Prisma.${model}.${operation}`, error, {
							model,
							operation,
							duration: `${duration.toFixed(1)}ms`,
						});
						throw error;
					}
				},
			},
		},
	});

	return extended as unknown as PrismaClient;
}

const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
