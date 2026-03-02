
"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Layout } from "lucide-react";

export function CustomSidebarTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button onClick={toggleSidebar} variant="ghost" size="icon">
      <Layout className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
