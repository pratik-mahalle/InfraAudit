import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Server, AlertTriangle, Eye, BarChart3, TrendingUp,
  DollarSign, Calculator, Shield, FileCheck, Lock, Cloud, Cpu, FileCode,
  Blocks, Zap, Target, Sparkles, FileText, CreditCard, User, Settings,
  Search, HelpCircle,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Monitor" },
  { label: "Resources", href: "/resources", icon: Server, group: "Monitor" },
  { label: "Alerts", href: "/alerts", icon: AlertTriangle, group: "Monitor" },
  { label: "Drift Detection", href: "/drift-detection", icon: Eye, group: "Monitor" },
  { label: "Cost Analysis", href: "/cost", icon: BarChart3, group: "Cost" },
  { label: "Predictions", href: "/cost-prediction", icon: TrendingUp, group: "Cost" },
  { label: "Billing Import", href: "/billing-import", icon: DollarSign, group: "Cost" },
  { label: "ROI Calculator", href: "/roi-calculator", icon: Calculator, group: "Cost" },
  { label: "Security Dashboard", href: "/security", icon: Shield, group: "Security" },
  { label: "Compliance", href: "/compliance", icon: FileCheck, group: "Security" },
  { label: "Vulnerabilities", href: "/vulnerabilities", icon: Lock, group: "Security" },
  { label: "Cloud Providers", href: "/cloud-providers", icon: Cloud, group: "Infrastructure" },
  { label: "Kubernetes", href: "/kubernetes", icon: Cpu, group: "Infrastructure" },
  { label: "IaC Management", href: "/iac", icon: FileCode, group: "Infrastructure" },
  { label: "Architecture", href: "/architecture-playground", icon: Blocks, group: "Infrastructure" },
  { label: "Jobs", href: "/automation", icon: Zap, group: "Automation" },
  { label: "Recommendations", href: "/recommendations", icon: Target, group: "Automation" },
  { label: "AI Analysis", href: "/ai-demo", icon: Sparkles, group: "Automation" },
  { label: "Reports", href: "/reports", icon: FileText, group: "Reports" },
  { label: "Subscription", href: "/subscription", icon: CreditCard, group: "Account" },
  { label: "Profile", href: "/profile", icon: User, group: "Account" },
  { label: "Settings", href: "/settings", icon: Settings, group: "Account" },
  { label: "Documentation", href: "/documentation", icon: HelpCircle, group: "Account" },
];

const groups = Array.from(new Set(navItems.map((i) => i.group)));

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg">
        <Command
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
          loop
        >
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <Search className="h-4 w-4 text-gray-400 mr-3 shrink-0" />
            <Command.Input
              placeholder="Search pages, actions..."
              className="w-full h-12 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 text-[10px] font-medium text-gray-500">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            {groups.map((group) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${item.group}`}
                      onSelect={() => {
                        navigate(item.href);
                        onOpenChange(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 cursor-pointer aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-blue-700 dark:aria-selected:text-blue-400 transition-colors"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
