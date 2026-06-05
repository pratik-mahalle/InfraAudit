import React, { useRef } from "react";
import { Helmet } from "react-helmet";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  FileCheck,
  Bug,
  GitBranch,
  ArrowRight,
  Check,
  Target,
  Zap,
  Eye,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const DISPLAY = "'Plus Jakarta Sans', sans-serif";
const BODY = "'IBM Plex Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: d, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function AboutPage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true });

  return (
    <>
      <Helmet>
        <title>About InfrAudit | Cloud Security Intelligence Platform</title>
        <meta name="description" content="InfraAudit is a cloud security intelligence platform for DevOps and SecOps teams — drift detection, vulnerability scanning, and compliance automation across AWS, Azure, GCP, and Kubernetes." />
      </Helmet>

      <div className="bg-white" style={{ fontFamily: BODY }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative bg-[#0a0a0b] py-28 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-900/10 rounded-full blur-[100px]" />

          <div className="max-w-4xl mx-auto relative text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[11px] text-slate-400 tracking-widest uppercase" style={{ fontFamily: MONO }}>
                  About InfrAudit
                </span>
              </div>
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0.1}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tight"
              style={{ fontFamily: DISPLAY }}>
              Built to catch what
              <br />
              <span className="text-slate-500">your cloud hides.</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0.2}
              className="text-slate-400 text-xl leading-relaxed max-w-2xl mx-auto"
              style={{ fontFamily: BODY }}>
              We're building the security intelligence layer every cloud team deserves — one that
              sees misconfigurations, vulnerabilities, and compliance gaps before attackers do.
            </motion.p>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <section ref={statsRef} className="py-16 px-6 border-b border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50K+", label: "Resources monitored daily",  color: "#dc2626" },
              { value: "4",    label: "Compliance frameworks",       color: "#2563eb" },
              { value: "99.9%",label: "Platform uptime SLA",         color: "#16a34a" },
              { value: "24/7", label: "Continuous security scanning", color: "#d97706" },
            ].map(({ value, label, color }, i) => (
              <motion.div key={i}
                initial="hidden" animate={statsInView ? "visible" : "hidden"}
                variants={fadeUp} custom={i * 0.08}
                className="text-center">
                <div className="text-4xl md:text-5xl font-black mb-2" style={{ color, fontFamily: DISPLAY }}>
                  {value}
                </div>
                <div className="text-sm text-slate-500" style={{ fontFamily: BODY }}>{label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Mission ──────────────────────────────────────────────────── */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-4"
                style={{ fontFamily: MONO }}>
                Our mission
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6"
                style={{ fontFamily: DISPLAY }}>
                Security shouldn't require
                a dedicated team to understand.
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-6" style={{ fontFamily: BODY }}>
                Cloud infrastructure is growing faster than the security tooling built to protect it.
                Teams are left blind to misconfigurations, compliance gaps, and vulnerabilities —
                not because they don't care, but because the tools are fragmented, noisy, and hard to act on.
              </p>
              <p className="text-slate-500 text-lg leading-relaxed mb-8" style={{ fontFamily: BODY }}>
                InfraAudit brings it all together: one platform that continuously scans your entire cloud,
                surfaces what matters, and makes remediation a one-click action.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg"
                  className="h-11 px-7 bg-slate-900 text-white hover:bg-slate-800 font-semibold rounded-xl text-sm">
                  <Link href="/auth">
                    Start scanning free <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg"
                  className="h-11 px-7 rounded-xl text-sm border-slate-200 text-slate-700 hover:bg-slate-50">
                  <Link href="/contact">Talk to us</Link>
                </Button>
              </div>
            </motion.div>

            {/* Highlight card */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#0a0a0b] rounded-2xl p-8 text-white"
            >
              <ShieldAlert className="w-10 h-10 mb-6 text-red-400" />
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: DISPLAY }}>
                The security gap is real.
              </h3>
              <p className="text-slate-400 mb-8 leading-relaxed" style={{ fontFamily: BODY }}>
                83% of cloud security failures are caused by misconfiguration, not sophisticated attacks.
                InfraAudit closes that gap automatically — across every cloud, every account, every day.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { stat: "83%", label: "Breaches from misconfiguration" },
                  { stat: "60s", label: "Time to first scan results" },
                  { stat: "1-click", label: "Auto-remediation" },
                  { stat: "4", label: "Compliance frameworks" },
                ].map(({ stat, label }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: DISPLAY }}>{stat}</div>
                    <div className="text-xs text-slate-500" style={{ fontFamily: BODY }}>{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── What we do ───────────────────────────────────────────────── */}
        <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="text-center mb-14">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3"
                style={{ fontFamily: MONO }}>
                Platform
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900" style={{ fontFamily: DISPLAY }}>
                What InfrAudit does
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: GitBranch,
                  title: "Drift Detection",
                  desc: "Continuously monitors your live infrastructure against Terraform and CloudFormation baselines. Any deviation triggers an alert — and optionally, a fix.",
                  accent: "#dc2626",
                  bg: "bg-red-50 border-red-100",
                },
                {
                  icon: Bug,
                  title: "Vulnerability Scanning",
                  desc: "Powered by Trivy and the NVD, InfraAudit scans for known CVEs across container images, OS packages, and application dependencies.",
                  accent: "#d97706",
                  bg: "bg-amber-50 border-amber-100",
                },
                {
                  icon: FileCheck,
                  title: "Compliance Automation",
                  desc: "Automated assessments against CIS, SOC 2, NIST 800-53, and PCI-DSS. Export audit-ready PDFs for your security team or external auditors.",
                  accent: "#2563eb",
                  bg: "bg-blue-50 border-blue-100",
                },
                {
                  icon: Eye,
                  title: "Multi-Cloud Visibility",
                  desc: "One unified dashboard across AWS, Azure, GCP, and Kubernetes. No context switching, no blind spots.",
                  accent: "#7c3aed",
                  bg: "bg-violet-50 border-violet-100",
                },
                {
                  icon: Zap,
                  title: "Auto-Remediation",
                  desc: "One-click remediation with a full approval workflow and audit trail. Fix issues immediately or route them through your existing change management process.",
                  accent: "#16a34a",
                  bg: "bg-green-50 border-green-100",
                },
                {
                  icon: Lock,
                  title: "Cost Intelligence",
                  desc: "AI-powered cost anomaly detection and savings recommendations — so your team sees the full picture, not just security.",
                  accent: "#0891b2",
                  bg: "bg-cyan-50 border-cyan-100",
                },
              ].map(({ icon: Icon, title, desc, accent, bg }, i) => (
                <motion.div key={title}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i * 0.07}
                  className={cn("rounded-2xl p-6 border-2", bg)}>
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2" style={{ fontFamily: DISPLAY }}>{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: BODY }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Values ───────────────────────────────────────────────────── */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900" style={{ fontFamily: DISPLAY }}>
                How we build
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Shield,
                  title: "Security by default",
                  desc: "Security is built into every feature we ship — not bolted on afterward.",
                },
                {
                  icon: Target,
                  title: "Signal over noise",
                  desc: "We prioritize findings that matter. Every alert should be actionable.",
                },
                {
                  icon: Eye,
                  title: "Full visibility",
                  desc: "No blind spots. Every account, every region, every resource — covered.",
                },
                {
                  icon: Zap,
                  title: "Fast time to value",
                  desc: "Connect your cloud and see your first findings in under 60 seconds.",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div key={title}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i * 0.1}
                  className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2" style={{ fontFamily: DISPLAY }}>{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: BODY }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-28 px-6 bg-[#0a0a0b] border-t border-white/5">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="max-w-3xl mx-auto text-center relative">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-5"
                style={{ fontFamily: DISPLAY }}>
                Start securing your
                <br />
                <span className="text-slate-500">cloud today.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto" style={{ fontFamily: BODY }}>
                14-day free trial. Full access. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg"
                  className="h-12 px-8 bg-white text-slate-950 hover:bg-slate-100 font-semibold rounded-xl text-sm">
                  <Link href="/auth">
                    Start free trial <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg"
                  className="h-12 px-8 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl text-sm">
                  <Link href="/contact">Talk to sales</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </>
  );
}
