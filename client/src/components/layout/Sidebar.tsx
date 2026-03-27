import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ChevronLeft,
    DollarSign,
    TrendingUp,
    Shield,
    AlertTriangle,
    FileCheck,
    Cloud,
    Server,
    Cpu,
    Zap,
    Settings,
    HelpCircle,
    Sparkles,
    BarChart3,
    Target,
    Lock,
    Eye,
    FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: "Monitor",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { label: "Resources", href: "/resources", icon: Server },
            { label: "Alerts", href: "/alerts", icon: AlertTriangle },
            { label: "Drift Detection", href: "/drift-detection", icon: Eye },
        ],
    },
    {
        label: "Cost",
        items: [
            { label: "Cost Analysis", href: "/cost", icon: BarChart3 },
            { label: "Predictions", href: "/cost-prediction", icon: TrendingUp },
            { label: "Billing Import", href: "/billing-import", icon: DollarSign },
        ],
    },
    {
        label: "Security",
        items: [
            { label: "Security Dashboard", href: "/security", icon: Shield },
            { label: "Compliance", href: "/compliance", icon: FileCheck },
            { label: "Vulnerabilities", href: "/vulnerabilities", icon: Lock },
        ],
    },
    {
        label: "Infrastructure",
        items: [
            { label: "Cloud Providers", href: "/cloud-providers", icon: Cloud },
            { label: "Kubernetes", href: "/kubernetes", icon: Cpu },
            { label: "IaC Management", href: "/iac", icon: FileCode },
        ],
    },
    {
        label: "Automation",
        items: [
            { label: "Jobs", href: "/automation", icon: Zap },
            { label: "Recommendations", href: "/recommendations", icon: Target },
            { label: "AI Analysis", href: "/ai-demo", icon: Sparkles },
        ],
    },
];

const bottomNavItems: NavItem[] = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help", href: "/documentation", icon: HelpCircle },
];

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
    const [location] = useLocation();
    const isActive = (href: string) => location === href;

    // Collapsed view — icon-only with tooltips
    if (isCollapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <aside className="fixed left-0 top-14 bottom-0 w-14 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40">
                    <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-800">
                        <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
                            <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
                        </Button>
                    </div>

                    <nav className="flex-1 py-2 overflow-y-auto">
                        {navGroups.map((group) => (
                            <div key={group.label} className="mb-1">
                                {group.items.map((item) => (
                                    <Tooltip key={item.href + item.label}>
                                        <TooltipTrigger asChild>
                                            <Link href={item.href}>
                                                <span
                                                    className={cn(
                                                        "flex items-center justify-center h-8 w-8 mx-auto rounded-md transition-colors my-0.5",
                                                        isActive(item.href)
                                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                                                            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
                                                    )}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                </span>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                                    </Tooltip>
                                ))}
                                <div className="mx-3 my-1.5 border-b border-gray-100 dark:border-gray-800" />
                            </div>
                        ))}
                    </nav>

                    <div className="py-2 border-t border-gray-200 dark:border-gray-800">
                        {bottomNavItems.map((item) => (
                            <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Link href={item.href}>
                                        <span className="flex items-center justify-center h-8 w-8 mx-auto rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors my-0.5">
                                            <item.icon className="h-4 w-4" />
                                        </span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </aside>
            </TooltipProvider>
        );
    }

    // Expanded view — compact flat list with group labels
    return (
        <aside className="fixed left-0 top-14 bottom-0 w-56 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Menu
                </span>
                <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
            </div>

            <nav className="flex-1 py-2 px-2 overflow-y-auto">
                {navGroups.map((group) => (
                    <div key={group.label} className="mb-3">
                        <div className="px-2 mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                {group.label}
                            </span>
                        </div>
                        {group.items.map((item) => (
                            <Link key={item.href + item.label} href={item.href}>
                                <span
                                    className={cn(
                                        "flex items-center gap-2.5 px-2 h-8 rounded-md text-[13px] transition-colors relative",
                                        isActive(item.href)
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-blue-500"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="py-2 px-2 border-t border-gray-200 dark:border-gray-800">
                {bottomNavItems.map((item) => (
                    <Link key={item.label} href={item.href}>
                        <span
                            className={cn(
                                "flex items-center gap-2.5 px-2 h-8 rounded-md text-[13px] transition-colors",
                                isActive(item.href)
                                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                    : "text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700"
                            )}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </aside>
    );
}
