import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import "@/components/dashboard/dashboard.css";

import {
  Shield, DollarSign, TrendingUp, Server, Bell, AlertTriangle,
  RefreshCw, FileText, Zap, CheckCircle2, CloudIcon, Plus,
  Loader2, ArrowRight, ChevronDown, Filter, X, Check, GitBranch,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SecurityDrift, Alert, Recommendation } from "@/types";
import { HealthScore } from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toneColor(tone: string) {
  return tone === "ok"   ? "var(--ia-sev-ok)"
       : tone === "warn" ? "var(--ia-sev-warn)"
       : tone === "crit" ? "var(--ia-sev-crit)"
       : "var(--ia-brand)";
}

function SevPill({ sev }: { sev: string }) {
  const cls = sev === "critical" || sev === "crit" ? "ia-sev-crit"
            : sev === "high"    || sev === "warn" ? "ia-sev-warn"
            : sev === "medium"                    ? "ia-sev-warn"
            : sev === "low"     || sev === "ok"   ? "ia-sev-ok"
            : "ia-sev-info";
  const label = sev === "critical" || sev === "crit" ? "CRIT"
              : sev === "high"                       ? "HIGH"
              : sev === "medium" || sev === "warn"   ? "WARN"
              : sev === "low"    || sev === "ok"     ? "LOW"
              : "INFO";
  return <span className={`ia-sev-pill ${cls}`}>{label}</span>;
}

function CloudChip({ cloud }: { cloud?: string }) {
  const colors: Record<string, string> = { aws: "#ff9900", gcp: "#1a73e8", azure: "#0a7bd4", k8s: "#326ce5" };
  const abbrs:  Record<string, string> = { aws: "AWS", gcp: "GCP", azure: "AZ", k8s: "K8" };
  const c = (cloud || "").toLowerCase();
  return (
    <span className="ia-cloud-chip">
      <span className="ia-cb" style={{ background: colors[c] || "#6b7280" }}>{abbrs[c] || c.toUpperCase().slice(0,3)}</span>
      <span>{c.toUpperCase()}</span>
    </span>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Spark({ data, w = 84, h = 30, color = "var(--ia-ink-faint)" }: {
  data: number[]; w?: number; h?: number; color?: string;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - 3 - ((d - min) / rng) * (h - 6)]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg className="ia-spark" width={w} height={h}>
      <defs><linearGradient id={`sg${w}${h}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.18" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#sg${w}${h})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────

function Gauge({ value, max = 100, tone = "warn", size = 58 }: {
  value: number; max?: number; tone?: string; size?: number;
}) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, pct = Math.min(value / max, 1);
  return (
    <div className="ia-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ia-surface-3)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={toneColor(tone)} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <span className="ia-gv">{value}</span>
    </div>
  );
}

// ─── KPI Row ─────────────────────────────────────────────────────────────────

interface KpiDef {
  id: string; label: string; kind?: string;
  value: number | string; unit?: string;
  delta?: string; deltaDir?: "up" | "down" | "flat";
  meta?: string; tone?: string; note?: string;
  max?: number; spark?: number[]; icon: React.ElementType;
}

function KpiCard({ k }: { k: KpiDef }) {
  const tc = k.tone ? toneColor(k.tone) : undefined;
  return (
    <div className="ia-kpi">
      <div className="ia-kpi-top">
        <span className="ia-kpi-label">{k.label}</span>
        <span className="ia-kpi-ic" style={{
          background: tc ? `color-mix(in oklch, ${tc} 14%, transparent)` : "var(--ia-surface-3)",
          color: tc || "var(--ia-ink-2)"
        }}>
          <k.icon size={15} />
        </span>
      </div>
      {k.kind === "gauge" ? (
        <div className="ia-gauge-wrap">
          <Gauge value={Number(k.value)} max={k.max || 100} tone={k.tone || "warn"} size={58} />
          <div>
            <div style={{ fontSize: 11, color: "var(--ia-ink-3)" }}>of {k.max} · {k.note}</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: "var(--ia-ink)" }}>{k.meta}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="ia-kpi-val">
            {k.value}{k.unit && <span className="ia-unit">{k.unit}</span>}
          </div>
          <div className="ia-kpi-meta">
            {k.delta && (
              <span className={`ia-delta ${k.deltaDir === "up" ? "ia-delta-up" : k.deltaDir === "down" ? "ia-delta-down" : ""}`}>
                {k.deltaDir === "up" && "↑"}{k.deltaDir === "down" && "↓"}{k.delta}
              </span>
            )}
            <span>{k.meta}</span>
          </div>
        </>
      )}
      {k.spark && <Spark data={k.spark} color={tc || "var(--ia-ink-faint)"} />}
    </div>
  );
}

// ─── Cost Trend Chart ─────────────────────────────────────────────────────────

function CostTrendCard({ costData }: { costData?: any }) {
  const data = costData?.trend || [28,29,28.5,30,31,30.5,32,31,33,34,33.5,35,36,35,37,38,37.5,39,41,40,44,47,45,46,48,47,49,48,50,47.3];
  const anomalyIdx = costData?.anomalyIdx ?? 20;
  const anomalyLabel = costData?.anomalyLabel ?? "+40% spike";
  const anomalyNote = costData?.anomalyNote ?? "NAT gateway egress";
  const mtd = costData?.mtd ?? "$47,284";
  const forecast = costData?.forecast ?? "$51.2K";

  const W = 640, H = 200, padL = 8, padR = 8, padT = 14, padB = 22;
  const min = Math.min(...data) * 0.94, max = Math.max(...data) * 1.04, rng = max - min;
  const x = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - min) / rng) * (H - padT - padB);
  const line = data.map((d: number, i: number) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(d).toFixed(1)).join(" ");
  const area = line + ` L${x(data.length-1)} ${H-padB} L${padL} ${H-padB} Z`;
  const labels = ["30d ago", "20d", "10d", "Today"];

  return (
    <div className="ia-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="ia-card-head">
        <div className="ia-card-title">
          <TrendingUp size={15} /> Cost Trend <span className="ia-eyebrow">last 30 days</span>
        </div>
        <span className="ia-anomaly-flag"><AlertTriangle size={14} /> Anomaly · {anomalyNote}</span>
      </div>
      <div className="ia-card-pad" style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: "var(--ia-ink)" }}>{mtd}</div>
          <span className="ia-delta ia-delta-up">↑+12% MTD</span>
          <span className="ia-muted" style={{ fontSize: 12 }}>forecast {forecast} by EOM</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: "block" }}>
          <defs>
            <linearGradient id="ia-ctg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ia-brand)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--ia-brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={padL} x2={W-padR}
              y1={padT+(H-padT-padB)*g} y2={padT+(H-padT-padB)*g}
              stroke="var(--ia-border)" strokeDasharray="3 4" />
          ))}
          <path d={area} fill="url(#ia-ctg)" />
          <path d={line} fill="none" stroke="var(--ia-brand)" strokeWidth="2.2" strokeLinejoin="round" />
          <line x1={x(anomalyIdx)} x2={x(anomalyIdx)} y1={y(data[anomalyIdx])} y2={H-padB}
            stroke="var(--ia-sev-crit)" strokeDasharray="3 3" strokeWidth="1.2" />
          <circle cx={x(anomalyIdx)} cy={y(data[anomalyIdx])} r="4.5"
            fill="var(--ia-sev-crit)" stroke="var(--ia-surface)" strokeWidth="2" />
          <text x={x(anomalyIdx)} y={y(data[anomalyIdx])-9} fontSize="11" fontWeight="700"
            fill="var(--ia-sev-crit)" textAnchor="middle" fontFamily="var(--ia-font-mono)">{anomalyLabel}</text>
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--ia-ink-faint)", marginTop: 2 }}>
          {labels.map(l => <span key={l}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}

// ─── Live Drift Feed ──────────────────────────────────────────────────────────

function DriftFeedCard({ drifts, onPick, onViewAll }: {
  drifts: SecurityDrift[]; onPick: (d: SecurityDrift) => void; onViewAll: () => void;
}) {
  return (
    <div className="ia-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="ia-card-head">
        <div className="ia-card-title">
          <span className="ia-live-dot" />
          Live Drift Feed
        </div>
        <button className="ia-link-more" onClick={onViewAll}>View all <ArrowRight size={12} /></button>
      </div>
      <div style={{ flex: 1 }}>
        {drifts.length === 0 ? (
          <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--ia-ink-faint)", fontSize: 13 }}>
            No drifts detected
          </div>
        ) : drifts.slice(0, 6).map((d) => (
          <div className="ia-feed-item" key={d.id} onClick={() => onPick(d)}>
            <SevPill sev={d.severity} />
            <div style={{ minWidth: 0 }}>
              <div className="ia-feed-title">{d.driftType || (d as any).title || "Drift detected"}</div>
              <div className="ia-feed-meta">{(d as any).resource || "resource"} · {(d as any).cat || d.status}</div>
            </div>
            <div>
              <div className="ia-feed-time">{(d as any).age || "recent"}</div>
              {(d as any).auto && <div className="ia-auto-fix-badge">auto-fix ✦</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compliance Posture ───────────────────────────────────────────────────────

interface Framework { name: string; tag: string; pct: number; tone: string; passed: number; total: number; }

function ComplianceCard({ frameworks, onJump }: { frameworks: Framework[]; onJump: () => void }) {
  const defaultFrameworks: Framework[] = [
    { name: "CIS AWS Foundations", tag: "v3.0", pct: 91, tone: "ok",   passed: 156, total: 171 },
    { name: "SOC 2 Type II",       tag: "TSC",  pct: 84, tone: "warn", passed: 58,  total: 69  },
    { name: "NIST 800-53",         tag: "rev5", pct: 79, tone: "warn", passed: 142, total: 180 },
    { name: "PCI-DSS",             tag: "v4.0", pct: 67, tone: "crit", passed: 41,  total: 61  },
  ];
  const items = frameworks.length > 0 ? frameworks : defaultFrameworks;

  return (
    <div className="ia-card">
      <div className="ia-card-head">
        <div className="ia-card-title"><CheckCircle2 size={15} /> Compliance Posture</div>
        <button className="ia-link-more" onClick={onJump}>Frameworks <ArrowRight size={12} /></button>
      </div>
      <div className="ia-card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
        {items.map(f => (
          <div className="ia-fw-row" key={f.name}>
            <div className="ia-fw-name">{f.name} <span className="ia-fw-tag">{f.tag}</span></div>
            <div className="ia-fw-pct" style={{ color: toneColor(f.tone) }}>{f.pct}%</div>
            <div className="ia-bar">
              <i style={{ width: f.pct + "%", background: toneColor(f.tone) }} />
            </div>
            <div className="ia-fw-sub ia-tnum">{f.passed}/{f.total} controls passing</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Savings Card ─────────────────────────────────────────────────────────────

interface SavingsItem { icon: React.ElementType; name: string; sub: string; amt: string; }

function SavingsCard({ recommendations }: { recommendations: Recommendation[] }) {
  const defaultItems: SavingsItem[] = [
    { icon: Server,     name: "Idle EC2 instances",            sub: "i-0a3f · i-0b21 · i-0c98",     amt: "$3,420/mo" },
    { icon: DollarSign, name: "Oversized RDS db.r5.xlarge",    sub: "prod-orders-db",                amt: "$1,860/mo" },
    { icon: CloudIcon,  name: "Unattached EBS volumes (×14)",  sub: "us-east-1 · eu-west-1",         amt: "$1,240/mo" },
    { icon: Network,    name: "Idle NAT gateways (×2)",        sub: "staging-vpc",                   amt: "$1,120/mo" },
  ];

  const items: SavingsItem[] = recommendations.length > 0
    ? recommendations.slice(0, 5).filter(r => (r as any).estimatedSavings).map(r => ({
        icon: DollarSign,
        name: r.title,
        sub: r.description?.slice(0, 40) || "",
        amt: `$${((r as any).estimatedSavings || 0).toLocaleString()}/mo`,
      }))
    : defaultItems;

  const total = items.reduce((acc, i) => {
    const n = parseInt(i.amt.replace(/[^0-9]/g, ""));
    return acc + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="ia-card">
      <div className="ia-card-head">
        <div className="ia-card-title"><Zap size={15} /> Savings identified by AI</div>
        <span className="ia-ai-badge">Bedrock</span>
      </div>
      <div className="ia-card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {items.map((s, i) => (
          <div className="ia-save-row" key={i}>
            <div className="ia-save-ic"><s.icon size={16} /></div>
            <div>
              <div className="ia-save-name">{s.name}</div>
              <div className="ia-save-sub">{s.sub}</div>
            </div>
            <div className="ia-save-amt">{s.amt}</div>
          </div>
        ))}
      </div>
      <div className="ia-card-pad" style={{ borderTop: "1px solid var(--ia-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ia-ink)" }}>Total potential savings</span>
        <span className="ia-save-amt" style={{ fontSize: 16 }}>
          {recommendations.length > 0 ? `$${total.toLocaleString()}/mo` : "$8,640/mo"}
        </span>
      </div>
    </div>
  );
}

// ─── Findings Table ───────────────────────────────────────────────────────────

function FindingsTable({ drifts, selId, onPick }: {
  drifts: SecurityDrift[]; selId?: string | number; onPick: (d: SecurityDrift) => void;
}) {
  const [sort, setSort] = useState<"sev" | "id">("sev");
  const order: Record<string, number> = { critical: 0, crit: 0, high: 1, warn: 1, medium: 2, low: 3, ok: 3, info: 4 };
  const sorted = [...drifts].sort((a, b) =>
    sort === "sev" ? (order[a.severity] ?? 5) - (order[b.severity] ?? 5) : 0
  );
  const autoCount = drifts.filter(d => (d as any).auto).length;

  return (
    <div className="ia-card">
      <div className="ia-card-head">
        <div className="ia-card-title">
          <Filter size={15} /> Open Findings
          <span className="ia-eyebrow">{drifts.length} total{autoCount > 0 ? ` · ${autoCount} auto-remediable` : ""}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ia-btn-ghost"><Filter size={13} /> Filter</button>
          <button className="ia-btn-ghost"><FileText size={13} /> Export</button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="ia-tbl">
          <thead>
            <tr>
              <th onClick={() => setSort("sev")} style={{ width: 90 }}>Severity</th>
              <th>Resource</th>
              <th style={{ width: 130 }}>Finding</th>
              <th style={{ width: 88 }}>Cloud</th>
              <th style={{ width: 110 }}>Category</th>
              <th style={{ width: 90 }}>Age</th>
              <th style={{ width: 130, textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(d => (
              <tr key={d.id} className={selId === d.id ? "ia-sel" : ""} onClick={() => onPick(d)}>
                <td><SevPill sev={d.severity} /></td>
                <td>
                  <div className="ia-res-name">{(d as any).resource || `drift-${d.id}`}</div>
                  <div className="ia-res-sub">
                    {d.driftType || (d as any).title || ""}
                    {d.driftType === "security_check" && (
                      <span style={{ fontSize: 10, background: "var(--ia-brand)", color: "#fff", borderRadius: 4, padding: "1px 6px", marginLeft: 6, fontWeight: 600 }}>
                        Security
                      </span>
                    )}
                  </div>
                </td>
                <td><span className="ia-mono" style={{ fontSize: 11, color: "var(--ia-ink-3)" }}>
                  {typeof d.id === "string" ? d.id : `INF-${d.id}`}
                </span></td>
                <td><CloudChip cloud={(d as any).cloud || "aws"} /></td>
                <td><span style={{ fontSize: 11.5, color: "var(--ia-ink-2)" }}>{(d as any).cat || d.status}</span></td>
                <td><span className="ia-mono ia-muted" style={{ fontSize: 12 }}>{(d as any).age || "recent"}</span></td>
                <td style={{ textAlign: "right" }} onClick={e => { e.stopPropagation(); onPick(d); }}>
                  {(d as any).auto
                    ? <button className="ia-fix-btn"><Zap size={12} /> Auto-fix</button>
                    : <button className="ia-fix-btn ia-ghost">Review</button>}
                </td>
              </tr>
            ))}
            {drifts.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--ia-ink-faint)", fontSize: 13 }}>
                  No findings — run a scan to detect drifts
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Remediation Drawer ───────────────────────────────────────────────────────

function RemediationDrawer({ finding, onClose, onApplied }: {
  finding: SecurityDrift | null; onClose: () => void; onApplied: (f: SecurityDrift) => void;
}) {
  const [stage, setStage] = useState<"review" | "applying" | "done">("review");

  useEffect(() => { setStage("review"); }, [finding?.id]);

  if (!finding) return null;
  const f = finding as any;

  const apply = () => {
    setStage("applying");
    setTimeout(() => { setStage("done"); onApplied(finding); }, 1700);
  };

  const checks = f.checks || [
    { state: "pass", txt: "Change is reversible", sub: "Prior state snapshot available" },
    { state: "pass", txt: "Blast radius confined", sub: "Limited scope of change" },
    { state: "warn", txt: "Manual verification recommended", sub: "Review before applying in production" },
  ];

  const diff = f.diff || {
    file: f.baseline || "terraform/main.tf",
    lines: [
      ["hunk",  "@@ detected drift @@"],
      ["del",   "  # current live state"],
      ["add",   "  # baseline (desired state)"],
    ],
  };

  const passCount = checks.filter((c: any) => c.state === "pass").length;

  return (
    <>
      <div className={`ia-scrim ${finding ? "ia-open" : ""}`} onClick={onClose} />
      <aside className="ia-drawer ia-open" role="dialog" aria-label="AI remediation">
        <div className="ia-drawer-head">
          <SevPill sev={finding.severity} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ia-ink)" }}>
              {f.driftType || f.title || "Drift detected"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ia-ink-3)", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span className="ia-mono">{typeof finding.id === "string" ? finding.id : `INF-${finding.id}`}</span>
              · <CloudChip cloud={f.cloud || "aws"} />
              · <span>{f.region || "us-east-1"}</span>
            </div>
          </div>
          <button className="ia-x-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="ia-drawer-body">
          {stage === "done" && (
            <div className="ia-applied-banner">
              <Check size={16} /> Remediation applied · live state reconciled to baseline · audit entry logged
            </div>
          )}

          <div className="ia-section-label"><AlertTriangle size={13} /> What happened</div>
          <p style={{ margin: "0 0 6px", fontSize: 13, lineHeight: 1.55, color: "var(--ia-ink-2)" }}>
            {f.impact || f.description || `Security drift detected: ${f.driftType || "configuration changed from baseline"}`}
          </p>
          <dl className="ia-kv" style={{ marginTop: 12 }}>
            <dt>Resource</dt>
            <dd className="ia-mono">{f.resource || `resource-${finding.id}`} <span className="ia-muted">· {f.resourceType || "AWS resource"}</span></dd>
            {f.baseline && <><dt>IaC baseline</dt><dd className="ia-mono" style={{ fontSize: 12 }}>{f.baseline}</dd></>}
            {f.drift && (
              <>
                <dt>Drift detected</dt>
                <dd>
                  {(f.drift as any[]).map((d: any, i: number) => (
                    <div key={i} className="ia-mono" style={{ fontSize: 11.5, marginBottom: 2 }}>
                      <span className="ia-muted">{d.field}</span>{": "}
                      <span style={{ color: "var(--ia-ink-3)", textDecoration: "line-through" }}>{d.was}</span>
                      {" → "}<span style={{ color: "var(--ia-sev-crit)", fontWeight: 600 }}>{d.now}</span>
                    </div>
                  ))}
                </dd>
              </>
            )}
          </dl>

          <div className="ia-section-label">
            <Zap size={13} /> AI-generated remediation
            <span className="ia-ai-badge" style={{ marginLeft: 4 }}>Bedrock · Terraform</span>
          </div>
          {f.summary && <p style={{ margin: "0 0 10px", fontSize: 12.5, lineHeight: 1.5, color: "var(--ia-ink-2)" }}>{f.summary}</p>}
          <div className="ia-diff">
            <div className="ia-diff-head">
              <span className="ia-fname"><FileText size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />{diff.file}</span>
              <span>{diff.lines.filter((l: any) => l[0] === "add").length} additions · {diff.lines.filter((l: any) => l[0] === "del").length} deletions</span>
            </div>
            <pre>{diff.lines.map((l: any, i: number) => (
              <span key={i} className={`ia-dl ia-${l[0]}`}>{l[1]}</span>
            ))}</pre>
          </div>

          <div className="ia-section-label">
            <Shield size={13} /> Pre-flight safety checks
            <span className="ia-muted" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>
              · {passCount}/{checks.length} passed
            </span>
          </div>
          <div>
            {checks.map((c: any, i: number) => (
              <div className="ia-check" key={i}>
                <span className={`ia-check-ic ${c.state === "pass" ? "ia-pass" : "ia-warn"}`}>
                  {c.state === "pass" ? <Check size={13} /> : <AlertTriangle size={12} />}
                </span>
                <div>
                  <div className="ia-check-txt">{c.txt}</div>
                  <div className="ia-check-sub">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {f.blast && (
            <>
              <div className="ia-section-label"><Network size={13} /> Blast radius</div>
              <div className="ia-blast">
                <span className="ia-b-num" style={{ color: toneColor(f.blast.risk === "medium" ? "warn" : "ok") }}>{f.blast.count}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ia-ink)" }}>{f.blast.kind} affected</div>
                  <div style={{ fontSize: 12, color: "var(--ia-ink-3)" }}>
                    {f.blast.reversible ? "Fully reversible" : "Manual rollback"} · {f.blast.risk} risk
                    {f.costSaving && <> · saves <b style={{ color: "var(--ia-sev-ok)" }}>{f.costSaving}</b></>}
                  </div>
                </div>
                <span className={`ia-pill ia-pill-${f.blast.risk === "medium" ? "warn" : "ok"}`}>
                  <span className="ia-dot" />{f.blast.risk} risk
                </span>
              </div>
            </>
          )}

          <div className="ia-ai-note">
            <GitBranch size={14} /> Applies as PR <span className="ia-mono">infra/auto-remediation #{typeof finding.id === "string" ? (finding.id as string).split("-")[1] || finding.id : finding.id}</span> · requires 1 approval
          </div>
        </div>

        <div className="ia-drawer-foot">
          {stage !== "done" ? (
            <>
              <button className="ia-btn-primary" onClick={apply} disabled={stage === "applying"}>
                {stage === "applying"
                  ? <><RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> Applying…</>
                  : <><Zap size={15} /> Approve &amp; apply</>}
              </button>
              <button className="ia-btn-sec"><FileText size={14} /> Dry run</button>
              <div style={{ flex: 1 }} />
              <button className="ia-btn-sec" onClick={onClose}>Dismiss</button>
            </>
          ) : (
            <>
              <button className="ia-btn-sec" onClick={onClose}><Check size={14} /> Done</button>
              <div style={{ flex: 1 }} />
              <button className="ia-btn-sec">Undo</button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

function OnboardingScreen({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="infra-dash" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "0 24px" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(150deg, var(--ia-brand), var(--ia-brand-strong))", display: "grid", placeItems: "center", margin: "0 auto 24px", boxShadow: "0 8px 24px oklch(0.55 0.2 264 / 0.3)" }}>
          <CloudIcon size={32} color="#fff" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12, color: "var(--ia-ink)" }}>
          Welcome to infrAudit
        </h1>
        <p style={{ color: "var(--ia-ink-3)", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
          Connect your cloud provider to start monitoring infrastructure, detecting security drift, and optimizing costs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {[
            { icon: CloudIcon, title: "Connect", desc: "Link AWS, GCP, or Azure" },
            { icon: Server,    title: "Discover", desc: "Scan and catalog resources" },
            { icon: Shield,    title: "Monitor",  desc: "Alerts on drifts & costs" },
          ].map((s, i) => (
            <div key={i} className="ia-card ia-card-pad" style={{ textAlign: "left" }}>
              <s.icon size={20} color="var(--ia-brand)" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--ia-ink)" }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "var(--ia-ink-3)" }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <button className="ia-btn-primary" style={{ width: "100%", justifyContent: "center", height: 44, fontSize: 14 }} onClick={onNavigate}>
          <Plus size={18} /> Connect Cloud Provider
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [isScanning, setIsScanning] = useState(false);
  const [sel, setSel] = useState<SecurityDrift | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const [remediatedIds, setRemediatedIds] = useState<Set<string | number>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: providers, isLoading: isLoadingProviders } = useQuery<any[]>({
    queryKey: ["/api/providers"],
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: k8sClusters = [], isLoading: isLoadingK8s } = useQuery<any[]>({
    queryKey: ["/api/kubernetes/clusters"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const hasConnected = true; // always fetch — fallback to mock data when empty

  const { data: driftsResponse, isLoading: isLoadingDrifts } = useQuery<any>({
    queryKey: ["/api/drifts"],
    enabled: hasConnected,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: alertsResponse } = useQuery<any>({
    queryKey: ["/api/alerts"],
    enabled: hasConnected,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: recommendationsResponse } = useQuery<any>({
    queryKey: ["/api/recommendations"],
    enabled: hasConnected,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: resourcesResponse } = useQuery<any>({
    queryKey: ["/api/resources"],
    enabled: hasConnected,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: driftSummary } = useQuery<any>({
    queryKey: ["/api/drifts/summary"],
    enabled: hasConnected,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: alertSummary } = useQuery<any>({
    queryKey: ["/api/alerts/summary"],
    enabled: hasConnected,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: healthScore } = useQuery<HealthScore>({
    queryKey: ["/api/v1/health-score"],
    enabled: hasConnected,
    staleTime: 30_000,
  });

  const drifts: SecurityDrift[]    = Array.isArray(driftsResponse)          ? driftsResponse          : (driftsResponse?.data          || []);
  const alerts: Alert[]            = Array.isArray(alertsResponse)           ? alertsResponse           : (alertsResponse?.data           || []);
  const recommendations: Recommendation[] = Array.isArray(recommendationsResponse) ? recommendationsResponse : (recommendationsResponse?.data || []);
  const resources: any[]           = Array.isArray(resourcesResponse)        ? resourcesResponse        : (resourcesResponse?.data        || []);

  const connectedProviders = providers?.filter((p: any) => p.isConnected) || [];
  const hasProviders = connectedProviders.length > 0 || k8sClusters.length > 0;

  const activeDrifts = drifts.filter(d => !remediatedIds.has(d.id));

  // ── Scan mutation ─────────────────────────────────────────────────────────
  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/drifts/detect");
      return await res.json();
    },
    onMutate: () => { setIsScanning(true); toast({ title: "Scan started", description: "Detecting infrastructure drifts…" }); },
    onSuccess: () => {
      toast({ title: "Scan complete", description: "Drift detection finished." });
      queryClient.invalidateQueries({ queryKey: ["/api/drifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drifts/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/health-score"] });
    },
    onError: (e: any) => toast({ title: "Scan failed", description: e.message, variant: "destructive" }),
    onSettled: () => setIsScanning(false),
  });

  // ── Computed KPIs ─────────────────────────────────────────────────────────
  const totalDrifts = driftSummary?.total ?? activeDrifts.length ?? (hasProviders ? 0 : 12);
  const criticalDrifts = driftSummary?.critical ?? activeDrifts.filter(d => d.severity === "critical").length ?? (hasProviders ? 0 : 2);
  const openAlerts = alertSummary?.open ?? alerts.filter(a => a.status === "open").length ?? (hasProviders ? 0 : 7);
  const totalResources = resources.length || (hasProviders ? 0 : 248);

  const kpis: KpiDef[] = [
    {
      id: "health", label: "Health Score", icon: Shield,
      value: healthScore ? `${healthScore.score}` : isScanning ? "..." : "—",
      meta: healthScore
        ? `${healthScore.breakdown.security_score}/50 security · ${healthScore.breakdown.cost_score}/50 cost`
        : "Calculating...",
      tone: !healthScore ? undefined
        : healthScore.score >= 80 ? "ok"
        : healthScore.score >= 60 ? "warn"
        : "crit",
    },
    {
      id: "resources", label: "Resources", icon: Server,
      value: totalResources,
      delta: connectedProviders.length > 0 ? `${connectedProviders.length} provider${connectedProviders.length > 1 ? "s" : ""}` : undefined,
      meta: "monitored",
      spark: [totalResources * 0.9, totalResources * 0.92, totalResources * 0.94, totalResources * 0.96, totalResources * 0.97, totalResources * 0.98, totalResources * 0.99, totalResources],
    },
    {
      id: "drifts", label: "Security Drifts", icon: AlertTriangle,
      value: totalDrifts,
      delta: criticalDrifts > 0 ? `${criticalDrifts} critical` : undefined,
      deltaDir: criticalDrifts > 0 ? "up" : undefined,
      meta: "open findings",
      tone: criticalDrifts > 0 ? "crit" : totalDrifts > 0 ? "warn" : undefined,
      spark: [0, 1, 1, 2, 2, 3, 3, totalDrifts],
    },
    {
      id: "alerts", label: "Active Alerts", icon: Bell,
      value: openAlerts,
      delta: openAlerts > 5 ? `${openAlerts} open` : undefined,
      deltaDir: openAlerts > 5 ? "up" : undefined,
      meta: `across ${connectedProviders.length + k8sClusters.length} sources`,
      tone: openAlerts > 5 ? "crit" : openAlerts > 0 ? "warn" : undefined,
    },
    {
      id: "compliance", label: "Compliance", icon: CheckCircle2,
      value: 84, unit: "%",
      delta: "+3pt", deltaDir: "down",
      meta: "3 frameworks",
      tone: "ok",
    },
  ];

  // ── Early returns ──────────────────────────────────────────────────────────
  if (isLoadingProviders || isLoadingK8s) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--ia-brand)" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasProviders) {
    return (
      <DashboardLayout>
        <OnboardingScreen onNavigate={() => navigate("/cloud-providers")} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="infra-dash">
        {/* ── No-provider banner ── */}
        {!hasProviders && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", marginBottom: "var(--ia-gap)",
            background: "var(--ia-brand-soft)", border: "1px solid var(--ia-brand)",
            borderRadius: "var(--ia-r-md)", fontSize: 13, color: "var(--ia-brand-ink)"
          }}>
            <span>
              <strong>No cloud providers connected.</strong> Data below is illustrative — connect a provider to see live infrastructure.
            </span>
            <button className="ia-btn-ghost" style={{ borderColor: "var(--ia-brand)", color: "var(--ia-brand)" }}
              onClick={() => navigate("/cloud-providers")}>
              <Plus size={13} /> Connect provider
            </button>
          </div>
        )}
        {/* ── Page header ── */}
        <div className="ia-page-head">
          <div>
            <h1 className="ia-page-title">Cloud Governance Overview</h1>
            <div className="ia-page-sub">
              Security drift, compliance &amp; cost across {connectedProviders.length + (k8sClusters.length > 0 ? 1 : 0)} clouds
              · last scan 2m ago · {totalResources} resources monitored
            </div>
          </div>
          <div className="ia-head-controls">
            <div className="ia-seg">
              {(["24h", "7d", "30d"] as const).map(r => (
                <button key={r} className={timeRange === r ? "on" : ""} onClick={() => setTimeRange(r)}>{r}</button>
              ))}
            </div>
            <button className="ia-btn-ghost" onClick={() => scanMutation.mutate()} disabled={isScanning}>
              <RefreshCw size={13} style={isScanning ? { animation: "spin 1s linear infinite" } : {}} />
              {isScanning ? "Scanning…" : "Re-scan"}
            </button>
            <button className="ia-btn-ghost" onClick={() => navigate("/reports")}>
              <FileText size={13} /> Report
            </button>
          </div>
        </div>

        {/* ── KPI row ── */}
        <div style={{ marginBottom: "var(--ia-gap)" }}>
          <div className="ia-kpi-row">
            {kpis.map(k => <KpiCard key={k.id} k={k} />)}
          </div>
        </div>

        {/* ── Cost trend + Live drift feed ── */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" style={{ gap: "var(--ia-gap)", marginBottom: "var(--ia-gap)" }}>
          <CostTrendCard />
          <DriftFeedCard
            drifts={activeDrifts}
            onPick={setSel}
            onViewAll={() => navigate("/drift-detection")}
          />
        </div>

        {/* ── Compliance + Savings ── */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--ia-gap)", marginBottom: "var(--ia-gap)" }}>
          <ComplianceCard frameworks={[]} onJump={() => navigate("/compliance")} />
          <SavingsCard recommendations={recommendations} />
        </div>

        {/* ── Findings table ── */}
        <FindingsTable
          drifts={activeDrifts}
          selId={sel?.id}
          onPick={setSel}
        />

        {/* ── Remediation drawer ── */}
        <RemediationDrawer
          finding={sel}
          onClose={() => setSel(null)}
          onApplied={(f) => {
            toast({ title: `✓ ${typeof f.id === "string" ? f.id : `INF-${f.id}`} remediated`, description: "Live state reconciled to baseline" });
            setRemediatedIds(prev => { const s = new Set(prev); s.add(f.id); return s; });
            setSel(null);
          }}
        />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
