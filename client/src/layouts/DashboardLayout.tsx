import React, { ReactNode, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useDriftStream } from "@/hooks/use-drift-stream";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
}

export function DashboardLayout({ children, hideSidebar = false }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  useDriftStream();

  // BUG-013 fix: Detect OS to show correct keyboard shortcut (⌘K on Mac, Ctrl+K on Windows/Linux)
  const shortcutLabel = useMemo(() => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    return isMac ? '⌘K' : 'Ctrl+K';
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
        {/* Search Trigger */}
        <div className="px-4 md:px-6 lg:px-8 py-4 flex justify-center">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="relative max-w-md w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-lg border border-border text-sm text-muted-foreground bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Search className="absolute left-3 h-4 w-4" />
            <span>Search pages, actions...</span>
            <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 text-[10px] font-medium text-gray-500">
              {shortcutLabel}
            </kbd>
          </button>
        </div>

        {/* Page Content */}
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
          {children}
        </div>
      </main>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
