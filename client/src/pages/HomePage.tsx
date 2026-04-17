import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Check,
  ArrowRight,
  Shield,
  DollarSign,
  TrendingDown,
  Cloud,
  Zap,
  Bell,
  BarChart3,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Database,
  Server,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// ─── Fonts ───────────────────────────────────────────────────────────────────
const DISPLAY = "'Plus Jakarta Sans', sans-serif";
const BODY = "'DM Sans', sans-serif";

// ─── Animation helpers ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

// Word-by-word stagger for hero headline
const wordContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const wordItem = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Count-up hook ───────────────────────────────────────────────────────────

function useCountUp(target: number, inView: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const raf = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [inView, target, duration]);
  return count;
}

// ─── Metric item with count-up ───────────────────────────────────────────────

function MetricItem({ prefix = "", value, suffix = "", label, inView }: {
  prefix?: string; value: number; suffix?: string; label: string; inView: boolean;
}) {
  const count = useCountUp(value, inView);
  return (
    <div className="text-center md:px-8">
      <div className="text-3xl font-black text-slate-900 mb-1 tabular-nums" style={{ fontFamily: DISPLAY }}>
        {prefix}{count}{suffix}
      </div>
      <div className="text-sm text-slate-500 leading-snug">{label}</div>
    </div>
  );
}

// ─── Dashboard mockup ────────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-14" style={{ perspective: "1400px" }}>
      <motion.div
        initial={{ opacity: 0, y: 56, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 4 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Subtle float on the whole mockup */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          {/* Browser chrome */}
          <div className="bg-[#161d2e] rounded-t-2xl px-4 py-3 flex items-center gap-3 border border-slate-700/60">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <div className="flex-1 mx-3 bg-slate-800/80 rounded-md h-6 flex items-center px-3">
              <div className="w-3 h-3 rounded-full border border-slate-600 mr-2 flex-shrink-0" />
              <span className="text-slate-500 text-xs font-mono">app.infraaudit.io/dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-500 hidden sm:block">Live</span>
            </div>
          </div>

          {/* App shell */}
          <div className="bg-[#0d1220] border border-t-0 border-slate-700/60 rounded-b-2xl overflow-hidden">
            {/* Top nav */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800">
              <div className="flex items-center gap-5">
                <span className="text-white text-sm font-semibold">InfraAudit</span>
                {["Dashboard", "Costs", "Security", "Resources"].map((item, i) => (
                  <span key={item} className={cn("text-xs font-medium hidden sm:block", i === 0 ? "text-blue-400" : "text-slate-500")}>
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden md:block">All systems operational</span>
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">P</div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-px bg-slate-800/40">
              {[
                { label: "Total Spend (MTD)", value: "$47,284", change: "+12% vs last month", warn: true },
                { label: "Cost Saved", value: "$16,340", change: "This month", pos: true },
                { label: "Resources Monitored", value: "248", change: "Across 3 clouds", neutral: true },
                { label: "Active Alerts", value: "7", change: "3 critical", crit: true },
              ].map((s) => (
                <div key={s.label} className="bg-[#0d1220] px-4 py-3">
                  <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">{s.label}</div>
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className={cn("text-[11px] mt-0.5 font-medium",
                    s.warn ? "text-amber-400" : s.pos ? "text-emerald-400" : s.crit ? "text-red-400" : "text-slate-500"
                  )}>{s.change}</div>
                </div>
              ))}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-3 gap-px bg-slate-800/40">
              <div className="col-span-2 bg-[#0d1220] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-300">Cost Trend — Last 30 Days</span>
                  <span className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Anomaly detected Aug 14
                  </span>
                </div>
                <svg viewBox="0 0 400 90" className="w-full h-20">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[22, 45, 68].map((y) => (
                    <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#1e293b" strokeWidth="1" />
                  ))}
                  <path d="M0,72 L40,68 L80,62 L120,57 L160,60 L200,52 L240,46 L280,18 L320,38 L360,34 L400,30 L400,90 L0,90 Z" fill="url(#chartGrad)" />
                  <motion.path
                    d="M0,72 L40,68 L80,62 L120,57 L160,60 L200,52 L240,46 L280,18 L320,38 L360,34 L400,30"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, delay: 1.2, ease: "easeInOut" }}
                  />
                  <circle cx="280" cy="18" r="4" fill="#ef4444" />
                  <line x1="280" y1="0" x2="280" y2="90" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                  <text x="284" y="14" fill="#ef4444" fontSize="8" fontFamily="monospace">+40%</text>
                </svg>
              </div>
              <div className="bg-[#0d1220] p-4">
                <span className="text-xs font-medium text-slate-300 block mb-2">Live Alerts</span>
                <div className="space-y-2">
                  {[
                    { text: "S3 bucket public access", level: "critical" },
                    { text: "Idle EC2 instances ×3", level: "warning" },
                    { text: "Spend spike +40%", level: "critical" },
                    { text: "IAM drift detected", level: "warning" },
                    { text: "RDS backup overdue", level: "warning" },
                  ].map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                        a.level === "critical" ? "bg-red-500" : "bg-amber-500"
                      )} />
                      <span className="text-[11px] text-slate-400 leading-snug">{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resource table */}
            <div className="bg-[#0d1220] border-t border-slate-800">
              <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <span className="text-xs font-medium text-slate-300">Top Resources by Spend</span>
                <span className="text-[11px] text-blue-400">View all →</span>
              </div>
              <table className="w-full">
                <tbody>
                  {[
                    { name: "prod-api-cluster", provider: "AWS", cost: "$1,240/mo", status: "Healthy", saving: "$340 identified" },
                    { name: "analytics-warehouse", provider: "GCP", cost: "$890/mo", status: "Warning", saving: "$180 identified" },
                    { name: "cdn-global-edge", provider: "Azure", cost: "$340/mo", status: "Healthy", saving: "$62 identified" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-4 py-2 text-xs text-slate-300 font-medium font-mono">{row.name}</td>
                      <td className="px-4 py-2 text-[11px] text-slate-500">{row.provider}</td>
                      <td className="px-4 py-2 text-xs text-white font-medium">{row.cost}</td>
                      <td className="px-4 py-2 text-[11px]">
                        <span className={cn("font-medium", row.status === "Healthy" ? "text-emerald-400" : "text-amber-400")}>{row.status}</span>
                      </td>
                      <td className="px-4 py-2 text-[11px] text-blue-400">{row.saving}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050810] via-[#050810]/70 to-transparent pointer-events-none rounded-b-2xl" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── FinOps visualization ─────────────────────────────────────────────────────

function CostVisualization() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const values = [62, 71, 68, 84, 79, 96];
  const max = Math.max(...values);

  return (
    <div ref={ref} className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Cloud Spend Overview</div>
            <div className="text-2xl font-bold text-slate-900">$47,284 <span className="text-base font-normal text-slate-400">/ this month</span></div>
          </div>
          <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +12% vs last month
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-end gap-2 h-24">
          {months.map((m, i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                <motion.div
                  className={cn("w-full rounded-t-md", i === months.length - 1 ? "bg-blue-500" : "bg-slate-200")}
                  initial={{ height: 0 }}
                  animate={inView ? { height: `${(values[i] / max) * 80}px` } : { height: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="text-[10px] text-slate-400">{m}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Savings Identified by AI</div>
        {[
          { label: "Idle EC2 instances (×3)", saving: "$340/mo", icon: Server },
          { label: "Oversized RDS db.r5.xlarge", saving: "$180/mo", icon: Database },
          { label: "Unattached EBS volumes", saving: "$62/mo", icon: Cloud },
        ].map(({ label, saving, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: 16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.4, ease: "easeOut" }}
            className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-white rounded-md border border-slate-200 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <span className="text-xs text-slate-600">{label}</span>
            </div>
            <span className="text-xs font-semibold text-emerald-600">{saving}</span>
          </motion.div>
        ))}
        <div className="flex items-center justify-between pt-2 px-3">
          <span className="text-sm font-semibold text-slate-700">Total potential savings</span>
          <span className="text-sm font-bold text-emerald-600">$582/mo</span>
        </div>
      </div>
    </div>
  );
}

// ─── DevOps drift feed ────────────────────────────────────────────────────────

function SecurityDriftFeed() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="bg-slate-950 rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl shadow-slate-950/60">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Security Monitor</div>
            <div className="text-[11px] text-slate-500">prod-cluster · us-east-1</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">87<span className="text-slate-500 text-sm font-normal">/100</span></div>
          <div className="text-[11px] text-amber-400">Security Score</div>
        </div>
      </div>

      {/* Compliance bars */}
      <div className="grid grid-cols-3 gap-px bg-slate-800/40">
        {[
          { label: "CIS Benchmarks", pct: 91, color: "bg-emerald-500" },
          { label: "SOC 2", pct: 84, color: "bg-blue-500" },
          { label: "NIST 800-53", pct: 79, color: "bg-amber-500" },
        ].map((f, i) => (
          <div key={f.label} className="bg-slate-950 px-4 py-3">
            <div className="text-[10px] text-slate-500 mb-1.5">{f.label}</div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", f.color)}
                initial={{ width: 0 }}
                animate={inView ? { width: `${f.pct}%` } : { width: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="text-xs font-semibold text-white mt-1">{f.pct}%</div>
          </div>
        ))}
      </div>

      {/* Drift events */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Live Drift Feed</span>
        </div>
        <div className="space-y-0 font-mono text-[11px]">
          {[
            { level: "CRITICAL", msg: "sg-0x4f opened to 0.0.0.0/0", time: "2s ago", color: "text-red-400 bg-red-500/10" },
            { level: "WARNING", msg: "S3 bucket public access enabled", time: "1m ago", color: "text-amber-400 bg-amber-500/10" },
            { level: "RESOLVED", msg: "IAM policy over-permissive fixed", time: "5m ago", color: "text-emerald-400 bg-emerald-500/10" },
            { level: "INFO", msg: "Drift: prod-vpc route table changed", time: "8m ago", color: "text-blue-400 bg-blue-500/10" },
            { level: "WARNING", msg: "EKS node group missing PodSecurity", time: "12m ago", color: "text-amber-400 bg-amber-500/10" },
          ].map((e, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.35, ease: "easeOut" }}
              className="flex items-start gap-3 py-2 border-b border-slate-800/60 last:border-0"
            >
              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0", e.color)}>
                {e.level}
              </span>
              <span className="text-slate-300 flex-1 leading-relaxed">{e.msg}</span>
              <span className="text-slate-600 flex-shrink-0">{e.time}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
          <Zap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-[11px] text-blue-300">Auto-remediation available for 2 issues</span>
        </div>
        <button className="text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
          Fix now
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const metricsRef = useRef(null);
  const metricsInView = useInView(metricsRef, { once: true, margin: "-60px" });

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  // Headline words split for stagger animation
  const line1 = ["Cut", "your", "cloud", "bill"];
  const line2 = ["by", "35%."];
  const line3 = ["Without", "the", "guesswork."];

  return (
    <div className="flex flex-col min-h-screen bg-white" style={{ fontFamily: BODY }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#050810] overflow-hidden -mt-14 pt-28 pb-0">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(to right, #3b82f6 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[420px] bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3.5 py-1.5 rounded-full mb-10"
          >
            <Zap className="w-3.5 h-3.5" />
            Now with AI cost forecasting — predict spend 90 days out
          </motion.div>

          {/* Animated headline */}
          <div className="mb-6 overflow-hidden">
            <motion.h1
              variants={wordContainer}
              initial="hidden"
              animate="visible"
              className="text-5xl md:text-6xl lg:text-[5.5rem] font-black text-white leading-[1.08] tracking-tight"
              style={{ fontFamily: DISPLAY }}
            >
              {/* Line 1 */}
              <span className="block">
                {line1.map((word) => (
                  <motion.span key={word} variants={wordItem} className="inline-block mr-[0.22em]">
                    {word}
                  </motion.span>
                ))}
              </span>
              {/* Line 2 */}
              <span className="block">
                {line2.map((word, i) => (
                  <motion.span
                    key={word}
                    variants={wordItem}
                    className={cn("inline-block mr-[0.22em]", i === 1 ? "text-blue-400" : "text-blue-400")}
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
              {/* Line 3 */}
              <span className="block text-slate-500">
                {line3.map((word) => (
                  <motion.span key={word} variants={wordItem} className="inline-block mr-[0.22em]">
                    {word}
                  </motion.span>
                ))}
              </span>
            </motion.h1>
          </div>

          {/* Subheadline */}
          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.5}
            variants={fadeUp}
            className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          >
            InfraAudit gives DevOps and FinOps teams a single platform to monitor costs,
            detect security drift, and act on AI-powered recommendations — across AWS, Azure, GCP, and Kubernetes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.65}
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5"
          >
            <Button
              asChild
              size="lg"
              className="h-12 px-7 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full shadow-lg shadow-blue-900/40 transition-all"
            >
              <Link href="/auth">
                Start free trial <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-7 border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:border-slate-600 rounded-full font-semibold transition-all"
            >
              <Link href="/contact">Get a demo</Link>
            </Button>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.75}
            variants={fadeUp}
            className="text-slate-600 text-sm"
          >
            14-day free trial · No credit card required · Cancel anytime
          </motion.p>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <DashboardMockup />
        </div>
      </section>

      {/* ── METRICS STRIP ────────────────────────────────────────────────── */}
      <section ref={metricsRef} className="bg-white border-b border-slate-100 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-slate-100">
            <MetricItem prefix="$" value={2} suffix="M+" label="Savings identified for customers" inView={metricsInView} />
            <MetricItem value={50} suffix="K+" label="Cloud resources monitored daily" inView={metricsInView} />
            <MetricItem value={35} suffix="%" label="Average cost reduction" inView={metricsInView} />
            <MetricItem value={99} suffix=".9%" label="Platform uptime SLA" inView={metricsInView} />
          </div>
        </div>
      </section>

      {/* ── FINOPS SECTION ───────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <DollarSign className="w-3.5 h-3.5" />
                For FinOps Teams
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-5" style={{ fontFamily: DISPLAY }}>
                Know exactly where
                <br />every dollar goes
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                InfraAudit ingests billing data across all your cloud providers and surfaces
                waste, anomalies, and forecasts — before your next invoice surprises you.
              </p>
              <ul className="space-y-3.5 mb-10">
                {[
                  "AI-detected cost anomalies with root-cause analysis",
                  "30, 60, and 90-day spend forecasting",
                  "Per-team and per-project cost allocation",
                  "Reserved instance and spot pricing recommendations",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all">
                See cost optimization in action <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <CostVisualization />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── DEVOPS SECTION ───────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="order-2 lg:order-1"
            >
              <SecurityDriftFeed />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Shield className="w-3.5 h-3.5" />
                For DevOps & Platform Teams
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-5" style={{ fontFamily: DISPLAY }}>
                Catch drift before
                <br />it becomes an incident
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                InfraAudit continuously scans your infrastructure for misconfigurations,
                security gaps, and drift from your IaC baselines — across AWS, Azure, GCP, and Kubernetes.
              </p>
              <ul className="space-y-3.5 mb-10">
                {[
                  "Real-time drift detection against Terraform and CloudFormation baselines",
                  "CIS Benchmarks, SOC 2, and NIST 800-53 compliance scanning",
                  "Slack and webhook alerts with one-click remediation",
                  "Vulnerability scanning powered by Trivy and NVD",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all">
                See security monitoring <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">How it works</div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900" style={{ fontFamily: DISPLAY }}>
              Up and running in minutes
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect your cloud",
                desc: "Link AWS, Azure, GCP, or Kubernetes with read-only OAuth. No agents to install. SOC 2 compliant.",
                tags: ["One-click OAuth", "Read-only access", "SOC 2 compliant"],
              },
              {
                step: "02",
                title: "AI analyzes everything",
                desc: "Gemini-powered AI scans costs, security, drift, and compliance 24/7. Results in under 60 seconds.",
                tags: ["Cost anomalies", "Security drift", "Compliance gaps"],
              },
              {
                step: "03",
                title: "Act on insights",
                desc: "Get actionable recommendations with one-click fixes, Slack alerts, and weekly digests for your team.",
                tags: ["Auto-remediation", "Slack alerts", "Weekly reports"],
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.12}
                variants={fadeUp}
                className="bg-white border border-slate-200 rounded-2xl p-7 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center mb-5 text-white font-black text-sm"
                  style={{ fontFamily: DISPLAY }}
                >
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{item.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
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
      <section className="py-28 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4" style={{ fontFamily: DISPLAY }}>
              Everything your cloud team needs
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              One platform. All your clouds. No context switching.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Globe, title: "Multi-Cloud Dashboard", desc: "Unified view across AWS, Azure, GCP, and Kubernetes. One login to see everything." },
              { icon: BarChart3, title: "AI Cost Recommendations", desc: "Gemini-powered insights with quantified ROI estimates for every suggestion." },
              { icon: Lock, title: "Compliance Automation", desc: "CIS Benchmarks, SOC 2, and NIST 800-53 scanning out of the box — with PDF export." },
              { icon: TrendingDown, title: "Cost Forecasting", desc: "30, 60, and 90-day AI spend predictions with anomaly detection and alerts." },
              { icon: Activity, title: "Drift Detection", desc: "IaC baseline comparison with auto-remediation and full audit trail." },
              { icon: Bell, title: "Slack & Webhooks", desc: "Alerts delivered where your team already works. Customizable severity thresholds." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.07}
                variants={fadeUp}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:border-blue-500 transition-colors">
                  <Icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ───────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#050810]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: DISPLAY }}>
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 text-lg">Start free. Scale as you grow. No hidden fees.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                tier: "Community",
                price: "Free",
                sub: "Self-hosted · MIT License",
                cta: "Deploy on GitHub",
                ctaHref: "https://github.com/pratik-mahalle/InfraAudit",
                external: true,
                highlight: false,
                features: ["Core monitoring features", "AWS, Azure, GCP support", "Community support", "MIT License"],
              },
              {
                tier: "Professional",
                price: "$89",
                sub: "per month · billed annually",
                cta: "Start free trial",
                ctaHref: "/auth",
                external: false,
                highlight: true,
                badge: "Most popular",
                features: ["Up to 200 resources", "Cost forecasting (30/60/90-day)", "Slack integration", "30-day data retention", "Priority support"],
              },
              {
                tier: "Enterprise",
                price: "Custom",
                sub: "Unlimited resources · Annual contract",
                cta: "Talk to sales",
                ctaHref: "/contact",
                external: false,
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
                  highlight ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-900/40" : "bg-slate-900/60 border-slate-700/60"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-sm font-semibold", highlight ? "text-blue-100" : "text-slate-300")}>{tier}</span>
                  {badge && (
                    <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">{badge}</span>
                  )}
                </div>
                <div className="text-4xl font-black mt-3 mb-1 text-white" style={{ fontFamily: DISPLAY }}>
                  {price}
                  {price !== "Free" && price !== "Custom" && (
                    <span className="text-base font-normal ml-1 opacity-60">/mo</span>
                  )}
                </div>
                <div className={cn("text-xs mb-6", highlight ? "text-blue-200" : "text-slate-500")}>{sub}</div>
                <ul className="space-y-3 flex-1 mb-7">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={cn("w-4 h-4 flex-shrink-0 mt-0.5", highlight ? "text-blue-100" : "text-slate-400")} />
                      <span className={cn("text-sm", highlight ? "text-blue-50" : "text-slate-300")}>{f}</span>
                    </li>
                  ))}
                </ul>
                {external ? (
                  <a
                    href={ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      highlight ? "bg-white text-blue-700 hover:bg-blue-50" : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                    )}
                  >
                    {cta}
                  </a>
                ) : (
                  <Link href={ctaHref}>
                    <span className={cn(
                      "block text-center py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors",
                      highlight ? "bg-white text-blue-700 hover:bg-blue-50" : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
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
            className="text-center text-slate-500 text-sm mt-8"
          >
            All plans include a 14-day free trial · Annual billing saves ~20%
          </motion.p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 bg-slate-950 border-t border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-5" style={{ fontFamily: DISPLAY }}>
              Stop guessing.
              <br />
              <span className="text-blue-400">Start knowing.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              InfraAudit gives your team complete visibility and control over your cloud — from day one.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full shadow-lg shadow-blue-900/40 text-base"
              >
                <Link href="/auth">
                  Start free trial — 14 days free <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 px-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full text-base"
              >
                <Link href="/contact">Get a demo</Link>
              </Button>
            </div>
            <p className="text-slate-600 text-sm mt-6">
              No credit card required · Setup in 5 minutes · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
