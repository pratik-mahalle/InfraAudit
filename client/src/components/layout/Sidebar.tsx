import React from "react";
import { Link, useLocation, useSearch } from "wouter";
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
    Calculator,
    CreditCard,
    FileText,
    User,
    Blocks,
    Scale,
    Fingerprint,
    BellRing,
    ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfraAuditLogo } from "@/components/ui/InfraAuditLogo";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermission } from "@/hooks/use-permission";
import { Permission } from "@/lib/permissions";

interface SidebarProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
    mobileOpen?: boolean;
    onNavigate?: () => void;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    permission?: Permission;
    isChild?: boolean;
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
            { label: "Billing Explorer", href: "/billing-explorer", icon: ReceiptText },
            { label: "Cost Monitor", href: "/cost-monitors", icon: BellRing },
            { label: "Predictions", href: "/cost-prediction", icon: TrendingUp },
            { label: "Billing Import", href: "/billing-import", icon: DollarSign },
            { label: "ROI Calculator", href: "/roi-calculator", icon: Calculator },
        ],
    },
    {
        label: "Security",
        items: [
            { label: "Command Center", href: "/security?view=all", icon: Shield },
            { label: "Compliance", href: "/security?view=compliance", icon: FileCheck, isChild: true },
            { label: "Findings", href: "/security?view=findings", icon: Fingerprint, isChild: true },
            { label: "Vulnerabilities", href: "/security?view=vulnerabilities", icon: Lock, isChild: true },
            { label: "SBOM", href: "/sbom", icon: FileText },
            { label: "Policies", href: "/policies", icon: Scale },
        ],
    },
    {
        label: "Infrastructure",
        items: [
            { label: "Cloud Providers", href: "/cloud-providers", icon: Cloud },
            { label: "Kubernetes", href: "/kubernetes", icon: Cpu, permission: "manage_providers" },
            { label: "IaC Management", href: "/iac", icon: FileCode },
            { label: "Architecture", href: "/architecture-playground", icon: Blocks },
        ],
    },
    {
        label: "Automation",
        items: [
            { label: "Jobs", href: "/automation", icon: Zap },
            { label: "Recommendations", href: "/recommendations", icon: Target },
            { label: "Resource Analysis", href: "/resource-analysis", icon: Sparkles },
        ],
    },
    {
        label: "Reports",
        items: [
            { label: "Reports", href: "/reports", icon: FileText },
        ],
    },
];

const bottomNavItems: NavItem[] = [
    { label: "Subscription", href: "/subscription", icon: CreditCard },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings, permission: "manage_settings" },
    { label: "Help", href: "/documentation", icon: HelpCircle },
];

export function Sidebar({ isCollapsed = false, onToggle, mobileOpen = false, onNavigate }: SidebarProps) {
    const [location] = useLocation();
    const search = useSearch();
    const currentSecurityView = new URLSearchParams(search).get("view") ?? "all";
    const isActive = (href: string) => {
        const [path, query = ""] = href.split("?");
        if (path === "/security") {
            const view = new URLSearchParams(query).get("view") ?? "all";
            return location === "/security" && currentSecurityView === view;
        }
        return location === path;
    };
    const { hasPermission } = usePermission();

    const filterByPermission = (items: NavItem[]) =>
        items.filter(item => !item.permission || hasPermission(item.permission));

    // Collapsed view — icon-only with tooltips
    if (isCollapsed && !mobileOpen) {
        return (
            <TooltipProvider delayDuration={0}>
                <aside className={cn(
                    "fixed bottom-0 left-0 top-0 z-40 w-14 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-950",
                    mobileOpen ? "flex" : "hidden md:flex"
                )}>
                    <div className="flex h-14 items-center justify-center border-b border-gray-200 dark:border-gray-800">
                        <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
                            <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
                        </Button>
                    </div>

                    <nav className="flex-1 py-2 overflow-y-auto">
                        {navGroups.map((group) => {
                            const visibleItems = filterByPermission(group.items);
                            if (visibleItems.length === 0) return null;
                            return (
                                <div key={group.label} className="mb-1">
                                    {visibleItems.map((item) => (
                                        <Tooltip key={item.href + item.label}>
                                            <TooltipTrigger asChild>
                                                <Link href={item.href} onClick={onNavigate}>
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
                            );
                        })}
                    </nav>

                    <div className="py-2 border-t border-gray-200 dark:border-gray-800">
                        {filterByPermission(bottomNavItems).map((item) => (
                            <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Link href={item.href} onClick={onNavigate}>
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
        <aside className={cn(
            "fixed bottom-0 left-0 top-0 z-40 w-56 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-950",
            mobileOpen ? "flex" : "hidden md:flex"
        )}>
            <div className="flex h-14 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-800">
                <Link href="/dashboard" className="flex min-w-0 items-center" onClick={onNavigate}>
                    <InfraAuditLogo height={30} />
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={mobileOpen ? onNavigate : onToggle}
                    className="h-6 w-6"
                    aria-label={mobileOpen ? "Close navigation" : "Collapse navigation"}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
            </div>

            <nav className="flex-1 py-2 px-2 overflow-y-auto">
                {navGroups.map((group) => {
                    const visibleItems = filterByPermission(group.items);
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={group.label} className="mb-3">
                            <div className="px-2 mb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    {group.label}
                                </span>
                            </div>
                            {visibleItems.map((item) => (
                                <Link key={item.href + item.label} href={item.href} onClick={onNavigate}>
                                    <span
                                        className={cn(
                                            "flex items-center gap-2.5 px-2 h-8 rounded-md text-[13px] transition-colors relative",
                                            item.isChild && "ml-5 h-7 text-[12px] before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-px before:bg-gray-200 dark:before:bg-gray-800",
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
                    );
                })}
            </nav>

            <div className="py-2 px-2 border-t border-gray-200 dark:border-gray-800">
                {filterByPermission(bottomNavItems).map((item) => (
                    <Link key={item.label} href={item.href} onClick={onNavigate}>
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
