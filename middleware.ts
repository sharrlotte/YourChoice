import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { getAuthEnvOrThrow } from "@/lib/env";

const authEnv = getAuthEnvOrThrow();

export const { auth } = NextAuth({
  ...authConfig,
  secret: authEnv.AUTH_SECRET,
  session: { strategy: "jwt" },
});

export default auth((req) => {
  // Add logic here if you want to protect routes
  // For now, we allow access to everything, but session is initialized
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
