import React, { ReactNode, useMemo, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useDriftStream } from "@/hooks/use-drift-stream";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { InfraAuditLogo } from "@/components/ui/InfraAuditLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
}

export function DashboardLayout({ children, hideSidebar = false }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
    <div className="min-h-screen bg-background text-foreground">
      {!hideSidebar && (
        <>
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            mobileOpen={mobileSidebarOpen}
            onNavigate={() => setMobileSidebarOpen(false)}
          />
          {mobileSidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
              aria-label="Close navigation"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </>
      )}

      <main
        className={cn(
          "min-h-screen bg-background transition-[margin] duration-300",
          !hideSidebar && (sidebarCollapsed ? "md:ml-14" : "md:ml-56")
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6 lg:px-8">
          {!hideSidebar && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                className="h-8 w-8 md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hidden h-8 w-8 md:inline-flex"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </>
          )}
          <div className="flex items-center md:hidden">
            <InfraAuditLogo height={30} />
          </div>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="relative ml-auto flex h-9 w-full max-w-xl items-center gap-3 rounded-md border border-border bg-background pl-10 pr-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            <Search className="absolute left-3 h-4 w-4" />
            <span>Search pages, actions...</span>
            <kbd className="ml-auto hidden h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
              {shortcutLabel}
            </kbd>
          </button>
          <ThemeToggle />
        </header>

        <div className="px-4 py-5 md:px-6 md:py-6 lg:px-8">
          {children}
        </div>
      </main>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
