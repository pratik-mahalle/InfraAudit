import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Lock,
  Globe,
  ArrowRight,
  Check,
  Bell,
  Zap,
  Eye,
  FileCheck,
  Search,
  BarChart3,
  TrendingDown,
  Server,
  GitBranch,
  ShieldAlert,
  ScanLine,
  Bug,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { InfraAuditLogo } from "@/components/ui/InfraAuditLogo";

// ─── Cloud provider logos (locally hosted in /public/logos/) ─────────────────
const CLOUD_LOGOS: Record<string, string> = {
  AWS:              "/logos/aws.svg",
  GCP:              "/logos/gcp.svg",
  K8s:              "/logos/k8s.svg",
  Azure:            "/logos/azure.svg",
};

// ─── Design tokens ───────────────────────────────────────────────────────────
const DISPLAY = "'Plus Jakarta Sans', sans-serif";
const BODY = "'IBM Plex Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

// ─── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

// ─── Count-up hook ───────────────────────────────────────────────────────────
function useCountUp(target: number, inView: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return count;
}

// ─── Severity pill ───────────────────────────────────────────────────────────
function SevPill({ level }: { level: "CRIT" | "HIGH" | "MED" | "LOW" | "OK" }) {
  const map = {
    CRIT: "bg-red-100 text-red-700 border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    MED:  "bg-amber-100 text-amber-700 border-amber-200",
    LOW:  "bg-blue-50 text-blue-600 border-blue-200",
    OK:   "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border tracking-wide", map[level])}
      style={{ fontFamily: MONO }}>
      {level}
    </span>
  );
}

// ─── Live Scan Feed (hero mockup) ────────────────────────────────────────────
const SCAN_ITEMS = [
  { sev: "CRIT" as const, msg: "S3 bucket public read enabled", resource: "prod-assets-s3", cloud: "AWS" },
  { sev: "HIGH" as const, msg: "IAM role with wildcard permissions", resource: "lambda-exec-role", cloud: "AWS" },
  { sev: "MED"  as const, msg: "Security group allows 0.0.0.0/0 on 22", resource: "bastion-sg", cloud: "GCP" },
  { sev: "CRIT" as const, msg: "Unencrypted RDS instance detected", resource: "prod-db-01", cloud: "AWS" },
  { sev: "HIGH" as const, msg: "Pod security policy not enforced", resource: "kube-default-ns", cloud: "K8s" },
  { sev: "MED"  as const, msg: "Root account MFA not enabled", resource: "root@acme.io", cloud: "Azure" },
  { sev: "LOW"  as const, msg: "Unused security group found", resource: "legacy-web-sg", cloud: "AWS" },
  { sev: "HIGH" as const, msg: "Exposed Kubernetes API endpoint", resource: "cluster-us-east", cloud: "K8s" },
];

function LiveScanFeed() {
  const [visible, setVisible] = useState<number[]>([]);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < SCAN_ITEMS.length) {
        setVisible((prev) => [...prev, i]);
        i++;
      } else {
        clearInterval(interval);
        setScanning(false);
      }
    }, 420);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d1117]"
      style={{ fontFamily: BODY }}>
      {/* Chrome bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-[#161b22]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <div className="ml-3 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-300">InfrAudit</span>
          <span className="text-[10px] text-slate-600">/security</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {scanning ? (
            <span className="flex items-center gap-1.5 text-[10px] text-amber-400" style={{ fontFamily: MONO }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
              </span>
              SCANNING
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] text-red-400" style={{ fontFamily: MONO }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
              </span>
              {visible.filter(i => SCAN_ITEMS[i]?.sev === "CRIT").length} CRITICAL
            </span>
          )}
        </div>
      </div>

      {/* Header row */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
        <ShieldAlert className="w-4 h-4 text-red-400" />
        <span className="text-sm font-semibold text-white">Live Security Scan</span>
        <span className="ml-auto text-[11px] text-slate-600" style={{ fontFamily: MONO }}>
          {visible.length}/{SCAN_ITEMS.length} resources checked
        </span>
      </div>

      {/* Scan results */}
      <div className="divide-y divide-white/5 min-h-[280px]">
        <AnimatePresence>
          {visible.map((idx) => {
            const item = SCAN_ITEMS[idx];
            if (!item) return null;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <SevPill level={item.sev} />
                <span className="text-xs text-slate-300 flex-1 truncate">{item.msg}</span>
                <span className="text-[10px] text-slate-600 shrink-0" style={{ fontFamily: MONO }}>{item.resource}</span>
                {CLOUD_LOGOS[item.cloud] && (
                  <img
                    src={CLOUD_LOGOS[item.cloud]}
                    alt={item.cloud}
                    title={item.cloud}
                    className="w-4 h-4 shrink-0"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Scanning cursor row */}
        {scanning && (
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-[10px] text-slate-600" style={{ fontFamily: MONO }}>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >▋</motion.span>
            </span>
            <span className="text-xs text-slate-600">Scanning next resource...</span>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-white/5 bg-[#161b22] flex items-center gap-5">
        {[
          { label: "Critical", val: visible.filter(i => SCAN_ITEMS[i]?.sev === "CRIT").length, color: "text-red-400" },
          { label: "High",     val: visible.filter(i => SCAN_ITEMS[i]?.sev === "HIGH").length, color: "text-orange-400" },
          { label: "Medium",   val: visible.filter(i => SCAN_ITEMS[i]?.sev === "MED").length,  color: "text-amber-400" },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn("text-sm font-bold tabular-nums", color)} style={{ fontFamily: MONO }}>{val}</span>
            <span className="text-[11px] text-slate-600">{label}</span>
          </div>
        ))}
        <div className="ml-auto text-[10px] text-slate-600" style={{ fontFamily: MONO }}>
          auto-remediation ready
        </div>
      </div>
    </div>
  );
}

// ─── Compliance bars (large section mockup) ──────────────────────────────────
const FRAMEWORKS = [
  { name: "CIS AWS Foundations v3.0",  score: 91, controls: "156/171", color: "#16a34a" },
  { name: "SOC 2 Type II (TSC)",        score: 84, controls: "58/69",   color: "#2563eb" },
  { name: "NIST 800-53 (rev5)",         score: 79, controls: "142/180", color: "#d97706" },
  { name: "PCI-DSS v4.0",              score: 67, controls: "41/61",   color: "#dc2626" },
];

function ComplianceMockup({ inView }: { inView: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <FileCheck className="w-4 h-4 text-slate-700" />
        <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: BODY }}>
          Compliance Posture
        </span>
        <span className="ml-auto text-xs text-slate-400">Last scan: 2 min ago</span>
      </div>
      <div className="p-5 space-y-5">
        {FRAMEWORKS.map((fw, i) => (
          <div key={fw.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700" style={{ fontFamily: BODY }}>{fw.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400" style={{ fontFamily: MONO }}>{fw.controls} controls</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: fw.color, fontFamily: MONO }}>
                  {fw.score}%
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: fw.color }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${fw.score}%` } : { width: 0 }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini dashboard snapshot ─────────────────────────────────────────────────
function DashboardSnapshot() {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      {/* Browser bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="ml-3 flex items-center gap-1 px-3 py-1 rounded bg-white border border-slate-200">
          <Lock className="w-2.5 h-2.5 text-slate-400" />
          <span className="text-[10px] text-slate-500" style={{ fontFamily: MONO }}>app.infraaudit.io/dashboard</span>
        </div>
      </div>

      {/* Dashboard layout */}
      <div className="p-4 bg-[#f8fafc]">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          {[
            { label: "Security Score", val: "87", unit: "/100", delta: "+3", up: true, color: "#16a34a" },
            { label: "Active Drifts", val: "14", unit: "", delta: "+2", up: false, color: "#dc2626" },
            { label: "Vulnerabilities", val: "23", unit: "", delta: "-5", up: true, color: "#d97706" },
            { label: "Compliance", val: "84", unit: "%", delta: "+1%", up: true, color: "#2563eb" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
              <div className="text-[10px] text-slate-400 mb-1.5" style={{ fontFamily: BODY }}>{kpi.label}</div>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold tabular-nums text-slate-900" style={{ fontFamily: DISPLAY }}>
                  {kpi.val}
                </span>
                <span className="text-xs text-slate-400 mb-0.5">{kpi.unit}</span>
              </div>
              <div className={cn(
                "text-[10px] font-medium mt-1",
                kpi.up ? "text-green-600" : "text-red-500"
              )} style={{ fontFamily: MONO }}>
                {kpi.delta} this week
              </div>
            </div>
          ))}
        </div>

        {/* Two-col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {/* Drift feed mini */}
          <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
              </span>
              <span className="text-[11px] font-semibold text-slate-700" style={{ fontFamily: BODY }}>Live Drifts</span>
            </div>
            <div className="space-y-2">
              {[
                { sev: "CRIT" as const, msg: "S3 bucket public access",  t: "1m ago" },
                { sev: "HIGH" as const, msg: "IAM wildcard permission",   t: "4m ago" },
                { sev: "MED"  as const, msg: "SG open port 22",           t: "9m ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <SevPill level={item.sev} />
                  <span className="text-[10px] text-slate-600 flex-1 truncate" style={{ fontFamily: BODY }}>{item.msg}</span>
                  <span className="text-[10px] text-slate-400" style={{ fontFamily: MONO }}>{item.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance mini bars */}
          <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-700 mb-3" style={{ fontFamily: BODY }}>Compliance</div>
            <div className="space-y-2.5">
              {[
                { fw: "CIS AWS",   pct: 91, color: "#16a34a" },
                { fw: "SOC 2",    pct: 84, color: "#2563eb" },
                { fw: "NIST",     pct: 79, color: "#d97706" },
              ].map((fw) => (
                <div key={fw.fw}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[10px] text-slate-500" style={{ fontFamily: BODY }}>{fw.fw}</span>
                    <span className="text-[10px] font-bold" style={{ color: fw.color, fontFamily: MONO }}>{fw.pct}%</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full">
                    <div className="h-full rounded-full transition-all" style={{ width: `${fw.pct}%`, backgroundColor: fw.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Metric stat ─────────────────────────────────────────────────────────────
function Metric({ prefix = "", value, suffix = "", label, inView }: {
  prefix?: string; value: number; suffix?: string; label: string; inView: boolean;
}) {
  const count = useCountUp(value, inView);
  return (
    <div className="text-center">
      <div className="text-4xl font-black text-white mb-1 tabular-nums" style={{ fontFamily: DISPLAY }}>
        {prefix}{count}{suffix}
      </div>
      <div className="text-sm text-slate-400" style={{ fontFamily: BODY }}>{label}</div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();

  const metricsRef = useRef<HTMLDivElement>(null);
  const metricsInView = useInView(metricsRef, { once: true, margin: "-80px" });

  const complianceRef = useRef<HTMLDivElement>(null);
  const complianceInView = useInView(complianceRef, { once: true, margin: "-80px" });

  return (
    <div className="overflow-x-hidden" style={{ fontFamily: BODY }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0a0b] min-h-[92vh] flex flex-col justify-center overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

        {/* Radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-900/10 rounded-full blur-[100px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Left — copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Framework badge strip */}
              <motion.div variants={fadeUp} custom={0}>
                <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[11px] text-slate-400 tracking-widest uppercase" style={{ fontFamily: MONO }}>
                    CIS · SOC 2 · NIST 800-53 · PCI-DSS
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                custom={0.1}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.0] mb-6 text-white tracking-tight"
                style={{ fontFamily: DISPLAY }}
              >
                Cloud security
                <br />
                <span className="relative inline-block">
                  that catches
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500/60 rounded" />
                </span>
                <br />
                <span className="text-slate-400">everything.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={0.2}
                className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8 max-w-sm sm:max-w-md"
                style={{ fontFamily: BODY }}
              >
                InfrAudit continuously scans AWS, Azure, GCP, and Kubernetes for
                misconfigurations, vulnerabilities, and compliance violations —
                and remediates them automatically.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} custom={0.3} className="flex flex-col sm:flex-row gap-3 mb-10">
                <Button asChild size="lg"
                  className="h-12 px-7 bg-white text-slate-950 hover:bg-slate-100 font-semibold rounded-xl text-sm shadow-lg">
                  <Link href={user ? "/dashboard" : "/auth"}>
                    Start scanning free <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg"
                  className="h-12 px-7 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl text-sm">
                  <a href="https://calendly.com/pratik-infraudit/30min" target="_blank" rel="noopener noreferrer">Request a demo</a>
                </Button>
              </motion.div>

              {/* Social proof chips */}
              <motion.div variants={fadeUp} custom={0.4}
                className="flex flex-wrap items-center gap-3">
                {[
                  { icon: CheckCircle2, text: "14-day free trial" },
                  { icon: Shield, text: "SOC 2 compliant" },
                  { icon: Zap, text: "Setup in 5 min" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <Icon className="w-3.5 h-3.5 text-slate-600" />
                    {text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — live scan feed */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <LiveScanFeed />
            </motion.div>
          </div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-[10px] text-slate-700 uppercase tracking-widest" style={{ fontFamily: MONO }}>scroll</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-6 bg-gradient-to-b from-slate-600 to-transparent"
          />
        </motion.div>
      </section>


      {/* ── SECURITY PILLARS ─────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-14"
          >
            <div className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-3"
              style={{ fontFamily: MONO }}>
              Security-first platform
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight max-w-2xl"
              style={{ fontFamily: DISPLAY }}>
              Every attack surface.
              <br />
              <span className="text-slate-400">Covered.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: GitBranch,
                label: "Infrastructure Drift",
                title: "Detect drift before it becomes an incident",
                desc: "Continuously compares your live infrastructure against Terraform and CloudFormation baselines. Any deviation — intended or not — surfaces immediately.",
                items: ["Real-time IaC baseline comparison", "Auto-remediation with audit trail", "Kubernetes config drift", "GitOps workflow integration"],
                accent: "#dc2626",
                bg: "bg-red-50",
                border: "border-red-100",
              },
              {
                icon: Bug,
                label: "Vulnerability Scanning",
                title: "CVE coverage across all your workloads",
                desc: "Powered by Trivy and the NVD, InfrAudit scans container images, OS packages, and dependencies for known CVEs — with fix guidance.",
                items: ["Trivy + NVD powered scanning", "Container & OS vulnerability coverage", "Severity-based prioritization", "SBOM generation & management"],
                accent: "#d97706",
                bg: "bg-amber-50",
                border: "border-amber-100",
              },
              {
                icon: FileCheck,
                label: "Compliance & Governance",
                title: "CIS, SOC 2, NIST, PCI-DSS out of the box",
                desc: "Run automated assessments against the industry's most critical frameworks. Export audit-ready PDF reports for your security team or auditors.",
                items: ["CIS Benchmarks v3.0", "SOC 2 Type II (TSC)", "NIST 800-53 rev5", "PCI-DSS v4.0 controls"],
                accent: "#2563eb",
                bg: "bg-blue-50",
                border: "border-blue-100",
              },
            ].map(({ icon: Icon, label, title, desc, items, accent, bg, border }, i) => (
              <motion.div
                key={label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i * 0.1}
                variants={fadeUp}
                className={cn("rounded-2xl p-7 border-2", border, bg, "hover:shadow-lg transition-all group")}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-sm">
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accent, fontFamily: MONO }}>
                  {label}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug" style={{ fontFamily: DISPLAY }}>
                  {title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5" style={{ fontFamily: BODY }}>
                  {desc}
                </p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent }} />
                      <span className="text-xs text-slate-600" style={{ fontFamily: BODY }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD SNAPSHOT ───────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14 items-center">
            {/* Copy */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} custom={0}
                className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3"
                style={{ fontFamily: MONO }}>
                Unified dashboard
              </motion.div>
              <motion.h2 variants={fadeUp} custom={0.08}
                className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-5"
                style={{ fontFamily: DISPLAY }}>
                Your entire cloud
                <br />security, at a glance
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.16}
                className="text-slate-500 text-lg leading-relaxed mb-8"
                style={{ fontFamily: BODY }}>
                One dashboard. Every cloud. Real-time security score, live drift events,
                compliance posture, and AI-generated savings — no context switching.
              </motion.p>
              <motion.ul variants={fadeUp} custom={0.24} className="space-y-3.5 mb-8">
                {[
                  "Real-time security score with trend sparklines",
                  "Live drift feed with auto-fix suggestions",
                  "Compliance posture across 4 frameworks",
                  "AI cost savings identified (avg $8,200/mo)",
                  "One-click remediation with approval workflow",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600" style={{ fontFamily: BODY }}>{item}</span>
                  </li>
                ))}
              </motion.ul>
              <motion.div variants={fadeUp} custom={0.32}>
                <Link href={user ? "/dashboard" : "/auth"}
                  className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all">
                  View live dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashboardSnapshot />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── METRICS STRIP ────────────────────────────────────────────────── */}
      <section ref={metricsRef} className="py-20 px-6 bg-[#0a0a0b] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-10">
            <Metric prefix="" value={50000} suffix="+"  label="Cloud resources monitored daily"  inView={metricsInView} />
            <Metric prefix="$" value={2}     suffix="M+" label="Savings identified for customers"  inView={metricsInView} />
            <Metric prefix="" value={99}     suffix=".9%" label="Platform uptime SLA"              inView={metricsInView} />
            <Metric prefix="" value={4}      suffix=""   label="Compliance frameworks supported"   inView={metricsInView} />
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE FRAMEWORKS ────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14 items-center">
            {/* Compliance mockup */}
            <motion.div
              ref={complianceRef}
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <ComplianceMockup inView={complianceInView} />
            </motion.div>

            {/* Copy */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} custom={0}
                className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-3"
                style={{ fontFamily: MONO }}>
                Automated compliance
              </motion.div>
              <motion.h2 variants={fadeUp} custom={0.08}
                className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-5"
                style={{ fontFamily: DISPLAY }}>
                Audit-ready.
                <br />Always.
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.16}
                className="text-slate-500 text-lg leading-relaxed mb-6"
                style={{ fontFamily: BODY }}>
                Stop scrambling before audits. InfrAudit runs continuous
                compliance scans against CIS, SOC 2, NIST 800-53, and PCI-DSS —
                and exports PDF reports on demand.
              </motion.p>

              <motion.div variants={fadeUp} custom={0.24} className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-8">
                {[
                  { fw: "CIS Benchmarks v3.0",    score: "91%", color: "#16a34a" },
                  { fw: "SOC 2 Type II",           score: "84%", color: "#2563eb" },
                  { fw: "NIST 800-53 rev5",        score: "79%", color: "#d97706" },
                  { fw: "PCI-DSS v4.0",           score: "67%", color: "#dc2626" },
                ].map(({ fw, score, color }) => (
                  <div key={fw} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div>
                      <div className="text-xs font-semibold text-slate-700" style={{ fontFamily: BODY }}>{fw}</div>
                      <div className="text-xs font-bold" style={{ color, fontFamily: MONO }}>{score} passing</div>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} custom={0.32}>
                <Link href={user ? "/compliance" : "/auth"}
                  className="inline-flex items-center gap-2 text-green-700 font-semibold text-sm hover:gap-3 transition-all">
                  Explore compliance module <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: MONO }}>
              How it works
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900" style={{ fontFamily: DISPLAY }}>
              Up and scanning in minutes
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                step: "01",
                icon: Globe,
                title: "Connect your cloud",
                desc: "Link AWS, Azure, GCP, or Kubernetes with read-only OAuth. No agents to install. SOC 2 compliant data handling.",
                tags: ["One-click OAuth", "Read-only access", "SOC 2 compliant"],
              },
              {
                step: "02",
                icon: ScanLine,
                title: "AI scans everything",
                desc: "Gemini-powered AI scans for security misconfigurations, CVEs, compliance violations, and cost anomalies — 24/7.",
                tags: ["Security drift", "CVE scanning", "Compliance gaps"],
              },
              {
                step: "03",
                icon: Zap,
                title: "Remediate instantly",
                desc: "Get actionable findings with one-click fixes, Slack alerts, and auto-remediation with full approval workflow.",
                tags: ["Auto-remediation", "Slack alerts", "Audit trail"],
              },
            ].map(({ step, icon: Icon, title, desc, tags }, i) => (
              <motion.div
                key={step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.12}
                variants={fadeUp}
                className="bg-white border border-slate-200 rounded-2xl p-7 hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-xs"
                    style={{ fontFamily: MONO }}>
                    {step}
                  </div>
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: DISPLAY }}>{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5" style={{ fontFamily: BODY }}>{desc}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag}
                      className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full"
                      style={{ fontFamily: BODY }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4" style={{ fontFamily: DISPLAY }}>
              Everything your security team needs
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto" style={{ fontFamily: BODY }}>
              One platform. All clouds. No blind spots.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {[
              { icon: ShieldAlert,  title: "Drift Detection",          desc: "Real-time comparison against Terraform and CloudFormation baselines with auto-remediation." },
              { icon: Bug,          title: "Vulnerability Scanning",   desc: "Trivy + NVD powered CVE scanning across container images, OS packages, and dependencies." },
              { icon: FileCheck,    title: "Compliance Automation",    desc: "CIS, SOC 2, NIST 800-53, and PCI-DSS scanning with audit-ready PDF report export." },
              { icon: Globe,        title: "Multi-Cloud Coverage",     desc: "Unified security view across AWS, Azure, GCP, and Kubernetes from one login." },
              { icon: Activity,     title: "Real-Time Alerts",         desc: "Slack, webhook, and email alerts with configurable severity thresholds and escalation." },
              { icon: BarChart3,    title: "AI Cost Insights",         desc: "Identify wasted spend alongside security findings — avg $8,200/mo savings identified." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.07}
                variants={fadeUp}
                className="border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-sm transition-all group bg-white"
              >
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-900 transition-colors">
                  <Icon className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2" style={{ fontFamily: DISPLAY }}>{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed" style={{ fontFamily: BODY }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 bg-[#0a0a0b]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: DISPLAY }}>
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 text-lg" style={{ fontFamily: BODY }}>Start free. Scale as you grow. No hidden fees.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                tier: "Starter",
                price: "$49",
                sub: "per month · billed monthly",
                cta: "Start free trial",
                ctaHref: "/auth",
                external: false,
                highlight: false,
                badge: null,
                features: ["Up to 50 resources", "Security drift detection", "Vulnerability scanning", "CIS Benchmarks", "7-day retention"],
              },
              {
                tier: "Professional",
                price: "$99",
                sub: "per month · billed monthly",
                cta: "Start free trial",
                ctaHref: "/auth",
                external: false,
                highlight: true,
                badge: "Most popular",
                features: ["Up to 200 resources", "Vulnerability scanning", "4 compliance frameworks", "Slack integration", "30-day data retention", "Priority support"],
              },
              {
                tier: "Enterprise",
                price: "Custom",
                sub: "Unlimited resources · Annual contract",
                cta: "Talk to sales",
                ctaHref: "https://calendly.com/pratik-infraudit/30min",
                external: true,
                highlight: false,
                features: ["Unlimited resources", "Custom compliance policies", "SSO / SAML", "Multi-account support", "Dedicated success manager"],
              },
            ].map(({ tier, price, sub, cta, ctaHref, external, highlight, badge, features }, i) => (
              <motion.div
                key={tier}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className={cn(
                  "rounded-2xl p-7 border flex flex-col",
                  highlight
                    ? "bg-white border-white shadow-xl shadow-white/5"
                    : "bg-white/5 border-white/10"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-sm font-semibold", highlight ? "text-slate-700" : "text-slate-300")}
                    style={{ fontFamily: BODY }}>{tier}</span>
                  {badge && (
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </div>
                <div className={cn("text-4xl font-black mt-3 mb-1 tabular-nums", highlight ? "text-slate-900" : "text-white")}
                  style={{ fontFamily: DISPLAY }}>
                  {price}
                  {price !== "Free" && price !== "Custom" && (
                    <span className="text-base font-normal ml-1 opacity-50">/mo</span>
                  )}
                </div>
                <div className={cn("text-xs mb-6", highlight ? "text-slate-400" : "text-slate-500")}
                  style={{ fontFamily: BODY }}>{sub}</div>
                <ul className="space-y-3 flex-1 mb-7">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={cn("w-4 h-4 flex-shrink-0 mt-0.5", highlight ? "text-slate-700" : "text-slate-500")} />
                      <span className={cn("text-sm", highlight ? "text-slate-600" : "text-slate-400")}
                        style={{ fontFamily: BODY }}>{f}</span>
                    </li>
                  ))}
                </ul>
                {external ? (
                  <a href={ctaHref} target="_blank" rel="noopener noreferrer"
                    className={cn(
                      "block text-center py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors",
                      highlight ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                    )}>
                    {cta}
                  </a>
                ) : (
                  <Link href={ctaHref}>
                    <span className={cn(
                      "block text-center py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors",
                      highlight ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                    )}>
                      {cta}
                    </span>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center text-slate-600 text-sm mt-8"
            style={{ fontFamily: BODY }}
          >
            All plans include a 14-day free trial · Annual billing saves ~20%
          </motion.p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0a0b] border-t border-white/5 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
        {/* Red glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-red-900/15 rounded-full blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
          {/* Big stat row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden mb-16 border border-white/5"
          >
            {[
              { stat: "83%", detail: "of cloud breaches caused by misconfiguration", accent: "#dc2626" },
              { stat: "60s", detail: "to your first scan results after connecting", accent: "#d97706" },
              { stat: "1-click", detail: "remediation with full audit trail", accent: "#16a34a" },
            ].map(({ stat, detail, accent }) => (
              <div key={stat} className="bg-[#0d0d0e] px-8 py-10 text-center">
                <div className="text-3xl sm:text-5xl md:text-6xl font-black mb-3 tabular-nums"
                  style={{ color: accent, fontFamily: DISPLAY }}>{stat}</div>
                <div className="text-sm text-slate-500 leading-relaxed max-w-[180px] mx-auto"
                  style={{ fontFamily: BODY }}>{detail}</div>
              </div>
            ))}
          </motion.div>

          {/* Copy + CTAs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-5"
                style={{ fontFamily: MONO }}>
                Get started today
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] mb-6"
                style={{ fontFamily: DISPLAY }}>
                Find your
                <br />
                <span className="relative inline-block">
                  vulnerabilities
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500/60 rounded" />
                </span>
                <br />
                <span className="text-slate-500">before attackers do.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-md"
                style={{ fontFamily: BODY }}>
                InfrAudit gives your security team complete visibility over every
                misconfiguration, CVE, and compliance gap — from day one.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg"
                  className="h-12 px-8 bg-white text-slate-950 hover:bg-slate-100 font-semibold rounded-xl shadow-lg text-sm">
                  <Link href={user ? "/dashboard" : "/auth"}>
                    Start 14-day free trial <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg"
                  className="h-12 px-8 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl text-sm">
                  <a href="https://calendly.com/pratik-infraudit/30min" target="_blank" rel="noopener noreferrer">Request a demo</a>
                </Button>
              </div>
              <p className="text-slate-700 text-xs mt-5" style={{ fontFamily: MONO }}>
                No credit card required · Setup in 5 min · Cancel anytime
              </p>
            </motion.div>

            {/* Right: Mini security checklist card */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/8 bg-[#0d0d0e] overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-white" style={{ fontFamily: BODY }}>
                  What InfrAudit checks on day 1
                </span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { text: "Public S3 buckets & storage misconfigs",   sev: "CRIT" as const },
                  { text: "IAM roles with wildcard permissions",       sev: "CRIT" as const },
                  { text: "Unencrypted databases & volumes",           sev: "HIGH" as const },
                  { text: "Security group open to 0.0.0.0/0",         sev: "HIGH" as const },
                  { text: "MFA not enforced on root/admin accounts",   sev: "HIGH" as const },
                  { text: "CIS / SOC 2 / NIST compliance gaps",        sev: "MED"  as const },
                  { text: "CVEs in container images & OS packages",    sev: "MED"  as const },
                  { text: "Kubernetes RBAC and pod security policies",  sev: "MED"  as const },
                ].map(({ text, sev }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * i, duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <SevPill level={sev} />
                    <span className="text-xs text-slate-400" style={{ fontFamily: BODY }}>{text}</span>
                    <ChevronRight className="w-3 h-3 text-slate-700 ml-auto flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-600" style={{ fontFamily: MONO }}>
                  + 200 more checks
                </span>
                <Link href={user ? "/dashboard" : "/auth"}>
                  <span className="text-[11px] font-semibold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors border border-slate-700">
                    Run a scan →
                  </span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
