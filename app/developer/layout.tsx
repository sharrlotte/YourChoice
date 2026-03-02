import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DeveloperLayout({ children }: { children: React.ReactNode }) {
	const session = await getSession();
	if (!session || session.user.role !== "DEVELOPER") {
		redirect("/");
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="w-full">
				<div className="flex items-center p-4 border-b">
					<CustomSidebarTrigger />
					<h1 className="ml-4 text-xl font-bold">Developer Dashboard</h1>
				</div>
				<div className="p-4">{children}</div>
			</main>
		</SidebarProvider>
	);
}
