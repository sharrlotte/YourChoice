"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

export function SignInButton() {
	const [isLoading, setIsLoading] = useState(false);

	const handleSignIn = async () => {
		setIsLoading(true);
		try {
			await signIn.social({
				provider: "google",
				callbackURL: "/",
			});
		} catch (error) {
			toast.error("Failed to sign in");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button onClick={handleSignIn} size="sm" disabled={isLoading}>
			{isLoading ? "Signing in..." : "Sign in with Google"}
		</Button>
	);
}
