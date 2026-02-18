import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ChevronDown,
    ChevronLeft,
    DollarSign,
    TrendingUp,
    Shield,
    AlertTriangle,
    FileCheck,
    Cloud,
    Server,
    Cpu,
    Database,
    Layers,
    Zap,
    Settings,
    HelpCircle,
    Sparkles,
    Activity,
    BarChart3,
    Target,
    Bell,
    Lock,
    Eye,
    RefreshCw,
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

interface NavSection {
    label: string;
    icon: React.ElementType;
    iconColor: string;
    items: NavItem[];
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
}

const navSections: NavSection[] = [
    {
        label: "Cost Optimization",
        icon: DollarSign,
        iconColor: "text-emerald-500",
        items: [
            { label: "Cost Analysis", href: "/cost", icon: BarChart3 },
            { label: "Predictions", href: "/cost-prediction", icon: TrendingUp },
            { label: "Recommendations", href: "/recommendations", icon: Target },
            { label: "Billing Import", href: "/billing-import", icon: DollarSign },
        ],
    },
    {
        label: "Security",
        icon: Shield,
        iconColor: "text-blue-500",
        items: [
            { label: "Security Dashboard", href: "/security", icon: Shield },
            { label: "Drift Detection", href: "/drift-detection", icon: AlertTriangle },
            { label: "Compliance", href: "/compliance", icon: FileCheck },
            { label: "Vulnerabilities", href: "/vulnerabilities", icon: Lock },
        ],
    },
    {
        label: "Infrastructure",
        icon: Cloud,
        iconColor: "text-violet-500",
        items: [
            { label: "Cloud Providers", href: "/cloud-providers", icon: Cloud },
            { label: "Resources", href: "/resources", icon: Server },
            { label: "Kubernetes", href: "/kubernetes", icon: Cpu },
            { label: "Databases", href: "/resources", icon: Database },
        ],
    },
    {
        label: "Automation",
        icon: Zap,
        iconColor: "text-amber-500",
        items: [
            { label: "Jobs", href: "/automation", icon: Zap },
            { label: "Scheduled Tasks", href: "/automation", icon: RefreshCw },
            { label: "Policies", href: "/automation", icon: FileCheck },
        ],
    },
    {
        label: "AI Insights",
        icon: Sparkles,
        iconColor: "text-pink-500",
        items: [
            { label: "AI Analysis", href: "/ai-demo", icon: Sparkles },
            { label: "Recommendations", href: "/ai-demo", icon: Target },
            { label: "Anomaly Detection", href: "/ai-demo", icon: Eye },
        ],
    },
];

const bottomNavItems: NavItem[] = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help & Support", href: "/documentation", icon: HelpCircle },
];

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
    const [location] = useLocation();
    const [expandedSections, setExpandedSections] = useState<string[]>(["Cost Optimization", "Security"]);

    const toggleSection = (label: string) => {
        setExpandedSections((prev) =>
            prev.includes(label)
                ? prev.filter((s) => s !== label)
                : [...prev, label]
        );
    };

    const isActive = (href: string) => location === href;

    if (isCollapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <aside className="fixed left-0 top-16 bottom-0 w-16 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40">
                    {/* Collapsed Logo Area */}
                    <div className="h-14 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4 rotate-180" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-4 overflow-y-auto">
                        {/* Dashboard Link */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard">
                                    <span
                                        className={cn(
                                            "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors mb-2",
                                            isActive("/dashboard")
                                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                                                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        )}
                                    >
                                        <LayoutDashboard className="h-5 w-5" />
                                    </span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">Dashboard</TooltipContent>
                        </Tooltip>

                        {/* Section Icons */}
                        <div className="space-y-2 mt-4">
                            {navSections.map((section) => (
                                <Tooltip key={section.label}>
                                    <TooltipTrigger asChild>
                                        <Link href={section.items[0].href}>
                                            <span
                                                className={cn(
                                                    "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors",
                                                    section.items.some((item) => isActive(item.href))
                                                        ? "bg-blue-50 dark:bg-blue-900/30"
                                                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                                )}
                                            >
                                                <section.icon className={cn("h-5 w-5", section.iconColor)} />
                                            </span>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">{section.label}</TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </nav>

                    {/* Bottom Items */}
                    <div className="py-4 border-t border-gray-200 dark:border-gray-800">
                        {bottomNavItems.map((item) => (
                            <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Link href={item.href}>
                                        <span className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                            <item.icon className="h-5 w-5" />
                                        </span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </aside>
            </TooltipProvider>
        );
    }

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40">
            {/* Header with collapse button */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Navigation
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="h-7 w-7"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
                {/* Dashboard Link */}
                <Link href="/dashboard">
                    <span
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-4",
                            isActive("/dashboard")
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-medium"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                    >
                        <div
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-lg",
                                isActive("/dashboard")
                                    ? "bg-blue-100 dark:bg-blue-900/50"
                                    : "bg-gray-100 dark:bg-gray-800"
                            )}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Dashboard</span>
                    </span>
                </Link>

                {/* Expandable Sections */}
                <div className="space-y-1">
                    {navSections.map((section) => {
                        const isExpanded = expandedSections.includes(section.label);
                        const hasActiveItem = section.items.some((item) => isActive(item.href));

                        return (
                            <div key={section.label}>
                                {/* Section Header */}
                                <button
                                    onClick={() => toggleSection(section.label)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                        hasActiveItem
                                            ? "bg-gray-100 dark:bg-gray-800/50"
                                            : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                                            hasActiveItem
                                                ? "bg-white dark:bg-gray-800 shadow-sm"
                                                : "bg-gray-100 dark:bg-gray-800"
                                        )}
                                    >
                                        <section.icon className={cn("h-4 w-4", section.iconColor)} />
                                    </div>
                                    <span className="flex-1 text-sm font-medium text-left text-gray-700 dark:text-gray-300">
                                        {section.label}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 text-gray-400 transition-transform duration-200",
                                            isExpanded && "rotate-180"
                                        )}
                                    />
                                </button>

                                {/* Section Items */}
                                {isExpanded && (
                                    <div className="mt-1 ml-11 space-y-0.5">
                                        {section.items.map((item) => (
                                            <Link key={item.label} href={item.href}>
                                                <span
                                                    className={cn(
                                                        "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                                        isActive(item.href)
                                                            ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 font-medium"
                                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                                                    )}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <item.icon className="h-3.5 w-3.5" />
                                                        {item.label}
                                                    </span>
                                                    {item.badge && (
                                                        <span
                                                            className={cn(
                                                                "px-1.5 py-0.5 text-xs font-medium text-white rounded-full",
                                                                item.badgeColor || "bg-gray-500"
                                                            )}
                                                        >
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="py-3 px-3 border-t border-gray-200 dark:border-gray-800">
                {bottomNavItems.map((item) => (
                    <Link key={item.label} href={item.href}>
                        <span
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                isActive(item.href)
                                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>
        </aside>
    );
}
