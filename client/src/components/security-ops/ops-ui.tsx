import React from "react";
import { LucideIcon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Tone = "red" | "orange" | "amber" | "yellow" | "blue" | "emerald" | "green" | "slate" | "violet" | "cyan";

const toneClasses: Record<Tone, string> = {
  red: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  slate: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
};

export const severityTone: Record<string, Tone> = {
  critical: "red",
  high: "orange",
  medium: "amber",
  low: "blue",
  info: "slate",
};

export const statusTone: Record<string, Tone> = {
  open: "red",
  detected: "red",
  acknowledged: "amber",
  resolved: "emerald",
  fixed: "emerald",
  ignored: "slate",
  approved: "blue",
  remediated: "emerald",
  passed: "emerald",
  failed: "red",
  enabled: "emerald",
  disabled: "slate",
  connected: "emerald",
  disconnected: "slate",
  error: "red",
  running: "emerald",
  pending: "amber",
};

export function ToneBadge({
  value,
  tone,
  className,
}: {
  value?: string | number | null;
  tone?: Tone;
  className?: string;
}) {
  const normalized = String(value ?? "unknown");
  const inferredTone = tone ?? severityTone[normalized.toLowerCase()] ?? statusTone[normalized.toLowerCase()] ?? "slate";

  return (
    <Badge variant="outline" className={cn("capitalize", toneClasses[inferredTone], className)}>
      {normalized.replace(/_/g, " ")}
    </Badge>
  );
}

export function MetricTile({
  label,
  value,
  icon: Icon,
  tone = "slate",
  helper,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  helper?: React.ReactNode;
}) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-1 text-2xl font-semibold tracking-normal text-foreground">{value}</div>
            {helper && <div className="mt-2 text-xs text-muted-foreground">{helper}</div>}
          </div>
          <div className={cn("rounded-md border p-2", toneClasses[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type FilterOption = {
  value: string;
  label: string;
};

export function FilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters: Array<{
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: FilterOption[];
    widthClassName?: string;
  }>;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>
      {filters.map((filter) => (
        <Select key={filter.placeholder} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className={cn("w-full sm:w-[150px]", filter.widthClassName)} aria-label={filter.placeholder}>
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}

export function EmptyPanel({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="mb-4 rounded-md border bg-muted/50 p-3 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

export function ActionButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button size="sm" {...props}>
      {children}
    </Button>
  );
}

export function compactDate(value?: string | Date | null) {
  if (!value) return "Unknown";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export { toneClasses };
