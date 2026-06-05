import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Shield, Zap, Building2 } from "lucide-react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const DISPLAY = "'Plus Jakarta Sans', sans-serif";
const BODY = "'IBM Plex Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: d, ease: [0.22, 1, 0.36, 1] },
  }),
};

const TIERS = [
  {
    name: "Starter",
    icon: Zap,
    monthly: 49,
    annual: 39,
    desc: "For small teams getting started with cloud security.",
    cta: "Start free trial",
    href: "/auth",
    highlight: false,
    badge: null,
    features: [
      "Up to 50 cloud resources",
      "Security drift detection",
      "Vulnerability scanning",
      "CIS Benchmarks compliance",
      "7-day data retention",
      "Email support",
    ],
  },
  {
    name: "Professional",
    icon: Shield,
    monthly: 99,
    annual: 79,
    desc: "For growing teams who need full security coverage.",
    cta: "Start free trial",
    href: "/auth",
    highlight: true,
    badge: "Most popular",
    features: [
      "Up to 200 cloud resources",
      "All 4 compliance frameworks",
      "Advanced drift detection",
      "CVE scanning + SBOM",
      "Cost optimization AI",
      "30-day data retention",
      "Slack & webhook alerts",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    icon: Building2,
    monthly: null,
    annual: null,
    desc: "For large-scale infrastructure with custom requirements.",
    cta: "Talk to sales",
    href: "/contact",
    highlight: false,
    badge: null,
    features: [
      "Unlimited cloud resources",
      "Custom compliance policies",
      "90-day data retention",
      "Multi-account management",
      "SSO / SAML authentication",
      "Custom integrations & API",
      "Dedicated success manager",
      "SLA guarantee",
    ],
  },
];

const FAQS = [
  {
    q: "What counts as a 'cloud resource'?",
    a: "A resource is any monitored asset — EC2 instances, S3 buckets, RDS databases, Kubernetes pods, Azure VMs, GCP compute instances, etc. Each distinct resource counts once regardless of how many checks run against it.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade at any time from your subscription settings. Upgrades are prorated immediately; downgrades take effect at the start of your next billing cycle.",
  },
  {
    q: "What happens after my 14-day trial?",
    a: "Your account continues on whichever paid plan you chose during signup. We'll send a reminder before your trial ends. No charges until you confirm.",
  },
  {
    q: "Do you offer annual billing discounts?",
    a: "Yes — annual billing saves approximately 20% compared to monthly. You can toggle between billing periods on this page to see the difference.",
  },
  {
    q: "Is my cloud data stored by InfraAudit?",
    a: "InfraAudit uses read-only OAuth access. We store metadata and scan results — never your cloud credentials or resource contents. All data is encrypted at rest and in transit.",
  },
  {
    q: "What compliance frameworks are supported?",
    a: "Professional and Enterprise plans include CIS AWS Foundations v3.0, SOC 2 Type II (TSC), NIST 800-53 rev5, and PCI-DSS v4.0. Starter plans include CIS Benchmarks only.",
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqRef = useRef<HTMLDivElement>(null);
  const faqInView = useInView(faqRef, { once: true });

  return (
    <div className="bg-white" style={{ fontFamily: BODY }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-16 px-6 bg-[#0a0a0b] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{ fontFamily: MONO }}>
              Pricing
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight" style={{ fontFamily: DISPLAY }}>
              Simple, transparent
              <br />
              <span className="text-slate-500">pricing.</span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              All paid plans include a 14-day free trial. No credit card required to start.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}
            className="inline-flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                !annual ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white"
              )}>
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                annual ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white"
              )}>
              Annual
              <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                −20%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing cards ────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map(({ name, icon: Icon, monthly, annual: annualPrice, desc, cta, href, highlight, badge, features }, i) => (
              <motion.div
                key={name}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.1 + i * 0.1}
                className={cn(
                  "rounded-2xl p-7 flex flex-col relative",
                  highlight
                    ? "bg-[#0a0a0b] border-2 border-slate-700 shadow-xl shadow-black/10"
                    : "bg-white border border-slate-200"
                )}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-bold bg-red-600 text-white px-3 py-1 rounded-full uppercase tracking-wide">
                      {badge}
                    </span>
                  </div>
                )}

                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                  highlight ? "bg-white/10" : "bg-slate-100"
                )}>
                  <Icon className={cn("w-5 h-5", highlight ? "text-white" : "text-slate-700")} />
                </div>

                <div className={cn("text-sm font-semibold mb-1", highlight ? "text-slate-300" : "text-slate-700")}>
                  {name}
                </div>
                <div className={cn("text-xs mb-5 leading-relaxed", highlight ? "text-slate-500" : "text-slate-400")}>
                  {desc}
                </div>

                {/* Price */}
                <div className="mb-6">
                  {monthly === null ? (
                    <div className={cn("text-4xl font-black", highlight ? "text-white" : "text-slate-900")}
                      style={{ fontFamily: DISPLAY }}>
                      Custom
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className={cn("text-4xl font-black tabular-nums", highlight ? "text-white" : "text-slate-900")}
                        style={{ fontFamily: DISPLAY }}>
                        ${annual ? annualPrice : monthly}
                      </span>
                      <span className={cn("text-sm mb-1.5", highlight ? "text-slate-500" : "text-slate-400")}>
                        /mo
                      </span>
                    </div>
                  )}
                  {monthly !== null && (
                    <div className={cn("text-xs mt-1", highlight ? "text-slate-600" : "text-slate-400")}>
                      {annual ? "billed annually" : "billed monthly"}
                      {annual && (
                        <span className="ml-2 text-green-500 font-medium">
                          save ${(monthly - annualPrice!) * 12}/yr
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-7">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={cn("w-4 h-4 flex-shrink-0 mt-0.5",
                        highlight ? "text-slate-400" : "text-slate-600")} />
                      <span className={cn("text-sm", highlight ? "text-slate-400" : "text-slate-600")}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={href}>
                  <span className={cn(
                    "block text-center py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors",
                    highlight
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  )}>
                    {cta}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center text-slate-400 text-sm mt-8"
            style={{ fontFamily: BODY }}>
            All plans include a 14-day free trial · No credit card required · Cancel anytime
          </motion.p>
        </div>
      </section>

      {/* ── Feature comparison ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3" style={{ fontFamily: DISPLAY }}>
              Everything you get
            </h2>
            <p className="text-slate-500" style={{ fontFamily: BODY }}>Full breakdown of what's included in each plan.</p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: BODY }}>
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 pr-6 font-semibold text-slate-900 w-1/2">Feature</th>
                  {["Starter", "Professional", "Enterprise"].map((t) => (
                    <th key={t} className="text-center py-3 px-4 font-semibold text-slate-900">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Cloud resources",          "50",     "200",    "Unlimited"],
                  ["Security drift detection", "✓",      "✓",      "✓"],
                  ["Vulnerability scanning",   "✓",      "✓",      "✓"],
                  ["CIS Benchmarks",           "✓",      "✓",      "✓"],
                  ["SOC 2 / NIST / PCI-DSS",   "—",      "✓",      "✓"],
                  ["Custom compliance policies","—",      "—",      "✓"],
                  ["SBOM generation",          "—",      "✓",      "✓"],
                  ["Cost optimizer AI",        "Basic",  "Full",   "Full"],
                  ["Data retention",           "7 days", "30 days","90 days"],
                  ["Slack & webhooks",         "—",      "✓",      "✓"],
                  ["SSO / SAML",               "—",      "—",      "✓"],
                  ["Multi-account support",    "—",      "—",      "✓"],
                  ["Support",                  "Email",  "Priority","Dedicated"],
                  ["API access",               "—",      "✓",      "✓"],
                ].map(([feature, starter, pro, ent]) => (
                  <tr key={feature} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-6 text-slate-700 font-medium">{feature}</td>
                    {[starter, pro, ent].map((val, i) => (
                      <td key={i} className="text-center py-3 px-4">
                        {val === "✓" ? (
                          <Check className="w-4 h-4 text-green-600 mx-auto" />
                        ) : val === "—" ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <span className="text-slate-600">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section ref={faqRef} className="py-20 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-2xl mx-auto">
          <motion.div initial="hidden" animate={faqInView ? "visible" : "hidden"} variants={fadeUp}
            className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3" style={{ fontFamily: DISPLAY }}>
              Common questions
            </h2>
          </motion.div>

          <div className="divide-y divide-slate-200">
            {FAQS.map((faq, i) => (
              <motion.div key={i}
                initial="hidden" animate={faqInView ? "visible" : "hidden"}
                variants={fadeUp} custom={i * 0.06}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left py-5 flex items-start justify-between gap-4 group"
                >
                  <span className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors text-sm"
                    style={{ fontFamily: DISPLAY }}>
                    {faq.q}
                  </span>
                  <span className={cn(
                    "mt-0.5 text-slate-400 transition-transform flex-shrink-0 text-lg leading-none",
                    openFaq === i && "rotate-45"
                  )}>+</span>
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pb-5 text-sm text-slate-500 leading-relaxed -mt-1"
                    style={{ fontFamily: BODY }}>
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enterprise CTA ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0a0a0b]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-5" style={{ fontFamily: MONO }}>
              Enterprise
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: DISPLAY }}>
              Need something custom?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto" style={{ fontFamily: BODY }}>
              Dedicated infrastructure, custom compliance policies, SSO, multi-account support,
              and a dedicated success manager. Let's talk.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg"
                className="h-12 px-8 bg-white text-slate-950 hover:bg-slate-100 font-semibold rounded-xl text-sm">
                <Link href="/contact">
                  Talk to sales <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg"
                className="h-12 px-8 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl text-sm">
                <Link href="/auth">Start free trial instead</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
