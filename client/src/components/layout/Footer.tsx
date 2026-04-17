import React from "react";
import { Link } from "wouter";
import { Github, Twitter, Linkedin, Cloud, Circle } from "lucide-react";

const FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif";

const NAV_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Cost Optimizer",    href: "/auth" },
      { label: "Security Monitor",  href: "/auth" },
      { label: "AI Insights",       href: "/auth" },
      { label: "Drift Detection",   href: "/auth" },
      { label: "Compliance",        href: "/auth" },
      { label: "Pricing",           href: "/pricing" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "Documentation",  href: "/documentation" },
      { label: "API Reference",  href: "/api" },
      { label: "Changelog",      href: "/documentation" },
      { label: "GitHub",         href: "https://github.com/pratik-mahalle/InfraAudit", external: true },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About",    href: "/about" },
      { label: "Contact",  href: "/contact" },
      { label: "Blog",     href: "/documentation" },
      { label: "Careers",  href: "/about" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",    href: "/privacy-policy" },
      { label: "Terms of Service",  href: "/terms-of-service" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="w-full bg-[#050810] border-t border-white/5"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">

          {/* Brand column — spans 2 cols */}
          <div className="col-span-2">
            <Link href="/">
              <span className="flex items-center gap-2.5 cursor-pointer mb-4 w-fit group">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <Cloud className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">
                  Infra<span className="text-blue-400">Audit</span>
                </span>
              </span>
            </Link>

            <p className="text-sm text-slate-500 leading-relaxed max-w-[220px] mb-6">
              AI-powered cloud cost optimization and security monitoring for DevOps and FinOps teams.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {[
                { icon: Github,   href: "https://github.com/pratik-mahalle/InfraAudit", label: "GitHub" },
                { icon: Twitter,  href: "https://twitter.com",                           label: "Twitter" },
                { icon: Linkedin, href: "https://linkedin.com",                          label: "LinkedIn" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {NAV_COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <div
                className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {heading}
              </div>
              <ul className="space-y-3">
                {links.map(({ label, href, external }: { label: string; href: string; external?: boolean }) =>
                  external ? (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-500 hover:text-white transition-colors"
                      >
                        {label}
                      </a>
                    </li>
                  ) : (
                    <li key={label}>
                      <Link href={href}>
                        <span className="text-sm text-slate-500 hover:text-white transition-colors cursor-pointer">
                          {label}
                        </span>
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-white/5" />
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Status pill */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </div>
            <span className="hidden sm:block text-slate-800 text-xs">·</span>
            <span className="hidden sm:block text-xs text-slate-600">
              © {year} InfraAudit
            </span>
          </div>

          {/* Right */}
          <p className="text-xs text-slate-700 text-center sm:text-right">
            Built for DevOps and FinOps teams who care about their cloud.
          </p>
        </div>
      </div>
    </footer>
  );
}
