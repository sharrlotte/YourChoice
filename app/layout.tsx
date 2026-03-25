import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
	title: "Your Choice",
	description: "Your choice",
};

import { Toaster } from "sonner";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<Providers>
					<NuqsAdapter>{children}</NuqsAdapter> <Toaster richColors position="top-right" />
				</Providers>
			</body>
		</html>
	);
}
