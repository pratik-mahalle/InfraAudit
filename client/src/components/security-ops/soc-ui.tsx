import React, { ReactNode, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  Bell,
  Bug,
  Cloud,
  FileText,
  Fingerprint,
  GitBranch,
  LucideIcon,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useAuth } from "@/hooks/use-auth";
import { useDriftStream } from "@/hooks/use-drift-stream";
import { cn } from "@/lib/utils";

type Tone = "red" | "orange" | "yellow" | "blue" | "green" | "slate" | "cyan";

const toneClasses: Record<Tone, string> = {
  red: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  slate: "border-border bg-muted text-muted-foreground",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
};

const navGroups: Array<{
  label: string;
  items: Array<{ label: string; href: string; icon: LucideIcon; countKey?: string }>;
}> = [
  {
    label: "Operations",
    items: [
      { label: "Command Center", href: "/security?view=all", icon: ShieldCheck },
      { label: "Findings", href: "/security?view=findings", icon: Fingerprint, countKey: "findings" },
      { label: "Vulnerabilities", href: "/security?view=vulnerabilities", icon: Bug, countKey: "vulnerabilities" },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Compliance", href: "/security?view=compliance", icon: Scale },
      { label: "Policies", href: "/policies", icon: FileText, countKey: "policies" },
    ],
  },
  {
    label: "Supply Chain",
    items: [{ label: "SBOM Library", href: "/sbom", icon: Terminal, countKey: "sbom" }],
  },
  {
    label: "Infrastructure",
    items: [{ label: "Cloud Providers", href: "/cloud-providers", icon: Cloud }],
  },
];

function normalizeCount(value?: number | string) {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

export function SocBadge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

export function SocPanel({
  title,
  eyebrow,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      {(title || eyebrow || actions) && (
        <div className="flex min-h-[58px] items-center justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>}
            {title && <h2 className="truncate text-base font-semibold text-foreground">{title}</h2>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function SocButton({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "ghost" && "border-border bg-background text-foreground hover:bg-muted",
        variant === "danger" && "border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/15 dark:text-red-300",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SocProgress({ value, tone = "blue" }: { value: number; tone?: Tone }) {
  const color = tone === "red" ? "bg-red-500" : tone === "orange" ? "bg-orange-500" : tone === "yellow" ? "bg-yellow-400" : tone === "green" ? "bg-green-500" : "bg-blue-500";
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function SocStat({
  label,
  value,
  tone = "slate",
  helper,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  helper?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className={cn("mt-2 text-3xl font-semibold text-foreground", tone === "red" && "text-red-600 dark:text-red-300", tone === "orange" && "text-orange-600 dark:text-orange-300", tone === "yellow" && "text-yellow-600 dark:text-yellow-300", tone === "blue" && "text-blue-600 dark:text-blue-300", tone === "green" && "text-emerald-600 dark:text-emerald-300")}>{value}</div>
      {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function SocWorkspace({
  section,
  title,
  counts,
  children,
}: {
  section: string;
  title: string;
  counts?: Record<string, number | string | undefined>;
  children: ReactNode;
}) {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const [commandOpen, setCommandOpen] = useState(false);
  const { user } = useAuth();
  useDriftStream();

  const initials = useMemo(() => {
    const name = user?.fullName || user?.username || user?.email || "IA";
    return name.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "IA";
  }, [user]);
  const currentSecurityView = new URLSearchParams(search).get("view") ?? "all";
  const signalCount = Object.values(counts ?? {}).reduce<number>((total, value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? total + parsed : total;
  }, 0);

  const isActive = (href: string) => {
    const [path, query = ""] = href.split("?");
    if (path === "/security") {
      const view = new URLSearchParams(query).get("view") ?? "all";
      return location === "/security" && currentSecurityView === view;
    }
    return location === path || location.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-card lg:border-b-0 lg:border-r">
          <div className="flex h-[72px] items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded border border-blue-500/50 bg-blue-500/10 text-blue-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">InfraAudit</p>
                <p className="text-xs text-muted-foreground">Security Ops</p>
              </div>
            </div>
            <SocBadge tone="green">Active</SocBadge>
          </div>
          <nav className="space-y-7 p-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const count = normalizeCount(item.countKey ? counts?.[item.countKey] : undefined);
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className={cn(
                          "flex h-10 w-full items-center gap-3 rounded-md border border-transparent px-3 text-left text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground",
                          active && "border-primary/30 bg-primary/10 text-primary",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {count && <span className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-auto hidden border-t border-border p-4 text-xs text-muted-foreground lg:block">
            <div className="flex justify-between"><span>Org</span><span>{user?.orgName || "Current org"}</span></div>
            <div className="mt-2 flex justify-between"><span>Role</span><span>{user?.role || "member"}</span></div>
          </div>
        </aside>

        <main className="min-w-0 bg-background">
          <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex min-h-[72px] flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{section}</p>
                <h1 className="text-base font-semibold text-foreground">{title}</h1>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-3 xl:max-w-[720px]">
                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className="relative flex h-10 min-w-0 flex-1 items-center rounded-md border border-border bg-background pl-10 pr-3 text-left text-sm text-muted-foreground hover:bg-muted"
                >
                  <Search className="absolute left-3 h-4 w-4" />
                  <span className="truncate">Search findings, CVEs, resources...</span>
                  <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
                </button>
                <button className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground" type="button" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="hidden items-center gap-3 border-l border-border pl-4 md:flex">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{user?.fullName || user?.username || user?.email || "Account"}</p>
                    <p className="text-xs text-muted-foreground">{user?.role || "member"}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">{initials}</div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-2 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> session <strong className="text-foreground">active</strong></span>
              <span>signals <strong className="text-foreground">{signalCount}</strong></span>
              <span className="flex items-center gap-2"><GitBranch className="h-3.5 w-3.5" /> policy data from API</span>
              <span className="ml-auto hidden xl:inline">InfraAudit security workspace</span>
            </div>
          </header>
          <div className="p-4 xl:p-5">{children}</div>
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
