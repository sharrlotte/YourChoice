import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { getAuthEnvOrThrow } from "@/lib/env";
import { headers } from "next/headers";

const authEnv = getAuthEnvOrThrow();

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	baseURL: authEnv.BETTER_AUTH_URL,
	basePath: "/api/v1",
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
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) return null;
	return {
		user: {
			...session.user,
			id: session.user.id,
			role: session.user.role as any,
		},
		session: session.session,
	};
}
