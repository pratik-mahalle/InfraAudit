import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { 
  Search,
  Play,
  Shield,
  DollarSign,
  Server,
  Bell,
  Settings,
  Cloud,
  BarChart3,
  FileText,
  AlertTriangle,
  Zap,
  RefreshCw,
  Download,
  Share2,
  HelpCircle,
  Keyboard,
  Home,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  onRunScan?: () => void;
  isScanning?: boolean;
}

export function CommandPalette({ onRunScan, isScanning }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const commands = {
    actions: [
      {
        icon: <Play className="h-4 w-4" />,
        label: "Run Infrastructure Scan",
        shortcut: "⌘S",
        action: () => onRunScan?.(),
        disabled: isScanning
      },
      {
        icon: <RefreshCw className="h-4 w-4" />,
        label: "Refresh Dashboard",
        shortcut: "⌘R",
        action: () => window.location.reload()
      },
      {
        icon: <Download className="h-4 w-4" />,
        label: "Export Report",
        action: () => toast({ title: "Export started", description: "Your report is being generated..." })
      },
      {
        icon: <Share2 className="h-4 w-4" />,
        label: "Share Dashboard",
        action: () => toast({ title: "Share link created", description: "Link copied to clipboard" })
      }
    ],
    navigation: [
      {
        icon: <LayoutDashboard className="h-4 w-4" />,
        label: "Dashboard",
        action: () => navigate("/dashboard")
      },
      {
        icon: <Shield className="h-4 w-4" />,
        label: "Security Monitoring",
        action: () => navigate("/security")
      },
      {
        icon: <DollarSign className="h-4 w-4" />,
        label: "Cost Optimization",
        action: () => navigate("/cost-optimization")
      },
      {
        icon: <Server className="h-4 w-4" />,
        label: "Resources",
        action: () => navigate("/resources")
      },
      {
        icon: <Bell className="h-4 w-4" />,
        label: "Alerts",
        action: () => navigate("/alerts")
      },
      {
        icon: <Cloud className="h-4 w-4" />,
        label: "Cloud Providers",
        action: () => navigate("/cloud-providers")
      },
      {
        icon: <BarChart3 className="h-4 w-4" />,
        label: "Analytics",
        action: () => navigate("/analytics")
      },
      {
        icon: <Settings className="h-4 w-4" />,
        label: "Settings",
        action: () => navigate("/settings")
      }
    ],
    help: [
      {
        icon: <FileText className="h-4 w-4" />,
        label: "Documentation",
        action: () => navigate("/documentation")
      },
      {
        icon: <HelpCircle className="h-4 w-4" />,
        label: "Help & Support",
        action: () => toast({ title: "Help", description: "Opening help center..." })
      },
      {
        icon: <Keyboard className="h-4 w-4" />,
        label: "Keyboard Shortcuts",
        shortcut: "⌘/",
        action: () => toast({ title: "Shortcuts", description: "⌘K - Command Palette, ⌘S - Scan, ⌘R - Refresh" })
      }
    ]
  };

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "relative h-10 w-full justify-start bg-white/80 dark:bg-slate-900/80",
          "text-sm font-normal text-muted-foreground shadow-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "sm:pr-12 md:w-64 lg:w-80"
        )}
      >
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <span className="hidden lg:inline-flex">Search commands...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Quick Actions">
            {commands.actions.map((cmd) => (
              <CommandItem
                key={cmd.label}
                onSelect={() => runCommand(cmd.action)}
                disabled={cmd.disabled}
                className="flex items-center gap-2"
              >
                <span className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg",
                  "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                )}>
                  {cmd.icon}
                </span>
                <span>{cmd.label}</span>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            {commands.navigation.map((cmd) => (
              <CommandItem
                key={cmd.label}
                onSelect={() => runCommand(cmd.action)}
                className="flex items-center gap-2"
              >
                <span className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg",
                  "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                )}>
                  {cmd.icon}
                </span>
                <span>{cmd.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Help & Support">
            {commands.help.map((cmd) => (
              <CommandItem
                key={cmd.label}
                onSelect={() => runCommand(cmd.action)}
                className="flex items-center gap-2"
              >
                <span className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg",
                  "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                )}>
                  {cmd.icon}
                </span>
                <span>{cmd.label}</span>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

