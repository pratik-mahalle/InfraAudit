import { Link } from "wouter";
import type React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Clock3,
  ExternalLink,
  FileJson,
  Fingerprint,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { Finding, FindingStatus } from "@/lib/api";
import { DetailRow, EmptyPanel, ToneBadge, compactDate } from "@/components/security-ops/ops-ui";

export const findingStatusOptions: Array<{ status: FindingStatus; label: string; icon: React.ElementType }> = [
  { status: "resolved", label: "Resolve", icon: CheckCircle2 },
  { status: "accepted", label: "Accept Risk", icon: ShieldCheck },
  { status: "false_positive", label: "False Positive", icon: CircleSlash },
  { status: "ignored", label: "Ignore", icon: ShieldOff },
  { status: "open", label: "Reopen", icon: AlertTriangle },
];

export function formatFindingLabel(value?: string) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/-/g, " ");
}

export function findingEvidence(finding?: Finding | null): Record<string, unknown> {
  if (!finding?.evidence) return {};
  try {
    const parsed = JSON.parse(finding.evidence);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return { raw: finding.evidence };
  }
}

export function FindingStatusActions({
  finding,
  onChange,
  isPending,
}: {
  finding: Finding;
  onChange: (status: FindingStatus) => void;
  isPending?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {findingStatusOptions
        .filter((item) => item.status !== finding.status)
        .map((item) => (
          <Button
            key={item.status}
            type="button"
            size="sm"
            variant={item.status === "resolved" ? "default" : "outline"}
            className="gap-2"
            disabled={isPending}
            onClick={() => onChange(item.status)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
    </div>
  );
}

export function FindingRow({
  finding,
  selected,
  onSelect,
  compact = false,
}: {
  finding: Finding;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}) {
  const content = (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <ToneBadge value={finding.severity} />
            <ToneBadge value={finding.status} />
            <ToneBadge value={formatFindingLabel(finding.findingType)} tone="blue" />
          </div>
          <h3 className="mt-2 line-clamp-1 text-sm font-semibold">{finding.title}</h3>
          {!compact && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{finding.description || "No description provided."}</p>}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{formatTimeAgo(finding.lastSeenAt)}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{finding.provider?.toUpperCase() || "Provider unknown"}</span>
        <span>{formatFindingLabel(finding.sourceType)}</span>
        {finding.scannerType && <span>{formatFindingLabel(finding.scannerType)}</span>}
        {finding.resourceId && <span className="font-mono">{finding.resourceId}</span>}
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn("w-full px-4 py-4 text-left transition-colors hover:bg-muted/50", selected && "bg-muted")}
      >
        {content}
      </button>
    );
  }

  return <div className="px-4 py-4">{content}</div>;
}

export function FindingDetailPanel({
  finding,
  onStatusChange,
  isStatusPending,
  showLink = true,
}: {
  finding?: Finding | null;
  onStatusChange?: (status: FindingStatus) => void;
  isStatusPending?: boolean;
  showLink?: boolean;
}) {
  if (!finding) {
    return (
      <EmptyPanel
        icon={Fingerprint}
        title="No finding selected"
        description="Select a finding from the queue to review evidence, source, remediation, and lifecycle actions."
      />
    );
  }

  const evidence = findingEvidence(finding);
  const evidenceEntries = Object.entries(evidence).filter(([, value]) => value !== "" && value !== undefined && value !== null);

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap gap-2">
          <ToneBadge value={finding.severity} />
          <ToneBadge value={finding.status} />
          <ToneBadge value={formatFindingLabel(finding.findingType)} tone="blue" />
          {finding.confidence && <ToneBadge value={`${finding.confidence} confidence`} tone="slate" />}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{finding.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{finding.description || "No description is attached to this finding."}</p>
          </div>
          {showLink && (
            <Button asChild size="sm" variant="outline" className="shrink-0 gap-2">
              <Link href={`/findings/${finding.id}`}>
                Full Page
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="Resource">{finding.resourceId || "Not resource-scoped"}</DetailRow>
        <DetailRow label="Provider">{finding.provider?.toUpperCase() || "Unknown"}</DetailRow>
        <DetailRow label="Resource Type">{formatFindingLabel(finding.resourceType)}</DetailRow>
        <DetailRow label="Source">{formatFindingLabel(finding.scannerType || finding.sourceType)}</DetailRow>
        <DetailRow label="Rule">{finding.ruleId || finding.externalId || "No rule ID"}</DetailRow>
        <DetailRow label="First Seen">{compactDate(finding.firstSeenAt)}</DetailRow>
        <DetailRow label="Last Seen">{compactDate(finding.lastSeenAt)}</DetailRow>
        <DetailRow label="Fingerprint"><span className="font-mono text-xs">{finding.fingerprint}</span></DetailRow>
      </dl>

      <div className="rounded-lg border p-4">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Remediation</p>
        <p className="text-sm text-muted-foreground">{finding.remediation || "No remediation guidance is attached yet."}</p>
      </div>

      {onStatusChange && (
        <div className="rounded-lg border p-4">
          <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Lifecycle</p>
          <FindingStatusActions finding={finding} onChange={onStatusChange} isPending={isStatusPending} />
        </div>
      )}

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
          <FileJson className="h-4 w-4" />
          Evidence
        </div>
        {evidenceEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No structured evidence was stored for this finding.</p>
        ) : (
          <div className="space-y-3">
            {evidenceEntries.slice(0, 8).map(([key, value]) => (
              <div key={key} className="grid gap-1">
                <p className="text-xs font-medium uppercase text-muted-foreground">{formatFindingLabel(key)}</p>
                <pre className="max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {finding.resolvedAt && (
        <div className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
          <Clock3 className="h-4 w-4" />
          Resolved {formatTimeAgo(finding.resolvedAt)}
        </div>
      )}
    </div>
  );
}
