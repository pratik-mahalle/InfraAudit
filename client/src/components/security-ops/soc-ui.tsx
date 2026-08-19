import React, { ReactNode } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { cn } from "@/lib/utils";
import { type Tone, toneClasses } from "@/components/security-ops/ops-ui";

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
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full", color)} style={{ width: `${clamped}%` }} />
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
  const metrics = Object.entries(counts ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== "");

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{section}</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{title}</h1>
        </div>
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metrics.map(([key, value]) => (
              <SocBadge key={key} tone="slate">{key} {value}</SocBadge>
            ))}
          </div>
        )}
      </div>
      {children}
    </DashboardLayout>
  );
}
