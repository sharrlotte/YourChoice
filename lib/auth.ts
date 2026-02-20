import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { getAuthEnvOrThrow, getMissingAuthEnvVars } from "@/lib/env";

const missingAuthEnvVars = getMissingAuthEnvVars();

if (missingAuthEnvVars.length > 0) {
	throw new Error(`Missing required authentication environment variables: ${missingAuthEnvVars.join(", ")}`);
}

const authEnv = getAuthEnvOrThrow();

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: "jwt",
	},
	secret: authEnv.AUTH_SECRET,
	callbacks: {
		async session({ session, token }) {
			if (token.sub && session.user) {
				session.user.id = token.sub;
			}
			if (token.role && session.user) {
				session.user.role = token.role as any;
			}
			return session;
		},
		async jwt({ token, user }) {
			if (user) {
				token.role = user.role;
			}
			return token;
		},
	},
	...authConfig,
});
