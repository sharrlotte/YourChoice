import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { getAuthEnvOrThrow } from "@/lib/env";
import { headers } from "next/headers";
import { logServerError } from "@/lib/logger";
import { Role } from "@/types";

const authEnv = getAuthEnvOrThrow();

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	baseURL: authEnv.BETTER_AUTH_URL,
	basePath: "/api/v1",
	trustedOrigins: [
		authEnv.BETTER_AUTH_URL,
		"https://yourchoice.smme.workers.dev",
		"http://localhost:3000",
		"http://localhost:3001",
	].filter(Boolean),
	socialProviders: {
		google: {
			clientId: authEnv.AUTH_GOOGLE_ID,
			clientSecret: authEnv.AUTH_GOOGLE_SECRET,
			redirectURI: `${authEnv.BETTER_AUTH_URL}/api/v1/callback/google`,
		},
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "USER",
			},
		},
	},
});

export async function getSession() {
	try {
		const headerList = await headers();
		const session = await auth.api.getSession({
			headers: headerList,
		});
		if (!session) return null;
		return {
			user: {
				...session.user,
				id: session.user.id,
				role: session.user.role as Role,
			},
			session: session.session,
		};
	} catch (error) {
		logServerError("getSession", error);
		return null;
	}
}
