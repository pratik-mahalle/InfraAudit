import React, { ReactNode, useState } from "react";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
}

export function DashboardLayout({ children, hideSidebar = false }: DashboardLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Search",
        description: `Searching for "${searchQuery}"`,
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Sidebar */}
      {!hideSidebar && (
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 bg-background pb-10 transition-all duration-300",
          !hideSidebar && (sidebarCollapsed ? "ml-16" : "ml-64")
        )}
      >
        {/* Search Bar */}
        <div className="px-4 md:px-6 lg:px-8 py-4 flex justify-center">
          <form onSubmit={handleSearch} className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Search resources, alerts, or configs..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm bg-white dark:bg-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
          </form>
        </div>

        {/* Page Content */}
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
