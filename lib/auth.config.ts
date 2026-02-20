import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { getAuthEnvOrThrow } from "@/lib/env";

const authEnv = getAuthEnvOrThrow();

export const authConfig = {
	providers: [
		Google({
			clientId: authEnv.AUTH_GOOGLE_ID,
			clientSecret: authEnv.AUTH_GOOGLE_SECRET,
		}),
	],
	pages: {
		error: "/auth/error",
	},
	// Add other Edge-compatible config here if needed
	basePath: "/api/v1",
} satisfies NextAuthConfig;
