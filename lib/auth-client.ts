import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
	basePath: "/api/v1",
});

export const { useSession, signIn, signOut } = authClient;
