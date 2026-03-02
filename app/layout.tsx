import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

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
					{children}
					<Toaster richColors position="top-right" />
				</Providers>
			</body>
		</html>
	);
}
