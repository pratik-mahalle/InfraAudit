import React, { ReactNode, useState, useEffect } from "react";
import { useDriftStream } from "@/hooks/use-drift-stream";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
}

export function DashboardLayout({ children, hideSidebar = false }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useDriftStream();

  // Automatically collapse sidebar on smaller screens (below 1024px)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    
    const handleMediaQueryChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    // Initial check
    handleMediaQueryChange(mediaQuery);

    mediaQuery.addEventListener("change", handleMediaQueryChange);
    return () => mediaQuery.removeEventListener("change", handleMediaQueryChange);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex w-full min-h-screen">
      {!hideSidebar && (
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      )}

      <main
        className={cn(
          "flex-1 bg-background pb-10 transition-all duration-300",
          !hideSidebar && (sidebarCollapsed ? "ml-14" : "ml-56")
        )}
      >
        {/* Page Content */}
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
