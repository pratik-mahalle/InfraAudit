import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronDown,
  Menu,
  X,
  LogOut,
  Settings,
  CreditCard,
  BookOpen,
  Github,
  Zap,
  Shield,
  BarChart3,
  Cloud,
  TrendingDown,
  Activity,
  Bell,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AskInfraAudit } from "@/components/ai/AskInfraAudit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductItem {
  icon: React.ElementType;
  label: string;
  desc: string;
  href: string;
  color: string;
}

interface DevItem {
  icon: React.ElementType;
  label: string;
  href: string;
  external?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRODUCTS: ProductItem[] = [
  { icon: TrendingDown, label: "Cost Optimizer",    desc: "AI-powered savings recommendations",       href: "/auth", color: "text-emerald-400 bg-emerald-500/10" },
  { icon: Shield,       label: "Security Monitor",  desc: "Drift & misconfiguration detection",       href: "/auth", color: "text-blue-400 bg-blue-500/10" },
  { icon: BarChart3,    label: "AI Insights",       desc: "Gemini-powered infrastructure analysis",   href: "/auth", color: "text-violet-400 bg-violet-500/10" },
  { icon: Cloud,        label: "Cloud Providers",   desc: "AWS, Azure, GCP, and Kubernetes",          href: "/auth", color: "text-sky-400 bg-sky-500/10" },
  { icon: Activity,     label: "Drift Detection",   desc: "IaC baseline comparison & auto-remediation", href: "/auth", color: "text-amber-400 bg-amber-500/10" },
  { icon: Bell,         label: "Alerts & Reports",  desc: "Slack, webhooks, and weekly digests",      href: "/auth", color: "text-rose-400 bg-rose-500/10" },
];

const DEVELOPERS: DevItem[] = [
  { icon: BookOpen,  label: "Documentation",  href: "/documentation" },
  { icon: Zap,       label: "API Reference",  href: "/api" },
  { icon: Github,    label: "GitHub",         href: "https://github.com/pratik-mahalle/InfraAudit", external: true },
];

// ─── Product dropdown ─────────────────────────────────────────────────────────

function ProductDropdown({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[520px] bg-[#0a0f1e] border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Platform</p>
      </div>

      {/* Grid */}
      <div className="p-3 grid grid-cols-2 gap-1">
        {PRODUCTS.map(({ icon: Icon, label, desc, href, color }) => (
          <Link key={label} href={href} onClick={onClose}>
            <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors leading-snug">
                  {label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-blue-300">Start free — no credit card needed</div>
          <div className="text-[11px] text-slate-500 mt-0.5">14-day trial with full access</div>
        </div>
        <Link href="/auth" onClick={onClose}>
          <span className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
            Get started →
          </span>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Developers dropdown ──────────────────────────────────────────────────────

function DevelopersDropdown({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-[#0a0f1e] border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
    >
      <div className="p-2">
        {DEVELOPERS.map(({ icon: Icon, label, href, external }) => {
          const inner = (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
              <Icon className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{label}</span>
              {external && <ExternalLink className="w-3 h-3 text-slate-600" />}
            </div>
          );
          return external ? (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={onClose}>{inner}</a>
          ) : (
            <Link key={label} href={href} onClick={onClose}>{inner}</Link>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Nav link with dropdown ───────────────────────────────────────────────────

function NavItem({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1 h-8 px-3 text-sm font-medium rounded-lg transition-colors",
          isOpen ? "text-white" : "text-slate-400 hover:text-white"
        )}
      >
        {label}
        <ChevronDown
          className={cn("w-3.5 h-3.5 transition-transform duration-200 opacity-60", isOpen && "rotate-180")}
        />
      </button>
      <AnimatePresence>{isOpen && children}</AnimatePresence>
    </div>
  );
}

// ─── Simple nav link ──────────────────────────────────────────────────────────

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [location] = useLocation();
  const active = location === href;
  return (
    <Link href={href}>
      <span
        className={cn(
          "h-8 px-3 flex items-center text-sm font-medium rounded-lg transition-colors cursor-pointer",
          active ? "text-white" : "text-slate-400 hover:text-white"
        )}
      >
        {children}
      </span>
    </Link>
  );
}

// ─── Main navbar ──────────────────────────────────────────────────────────────

export function Navbar() {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
    setMobileOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const toggle = (name: string) =>
    setActiveDropdown((prev) => (prev === name ? null : name));

  const getInitials = (name: string) =>
    (name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 h-14 transition-all duration-300",
          scrolled
            ? "bg-slate-950/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
            : "bg-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-700/30 group-hover:bg-blue-500 transition-colors">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              Infra<span className="text-blue-400">Audit</span>
            </span>
          </Link>

          {/* Center nav — public only */}
          {!user && (
            <div className="hidden md:flex items-center gap-0.5">
              <NavItem
                label="Products"
                isOpen={activeDropdown === "Products"}
                onToggle={() => toggle("Products")}
              >
                <ProductDropdown onClose={() => setActiveDropdown(null)} />
              </NavItem>

              <NavItem
                label="Developers"
                isOpen={activeDropdown === "Developers"}
                onToggle={() => toggle("Developers")}
              >
                <DevelopersDropdown onClose={() => setActiveDropdown(null)} />
              </NavItem>

              <NavLink href="/pricing">Pricing</NavLink>
              <NavLink href="/about">About</NavLink>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Authenticated */}
            {user && <AskInfraAudit />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-transparent hover:ring-blue-500/40 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                        {getInitials(user.fullName || user.username)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-[#0a0f1e] border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 text-slate-200"
                >
                  <DropdownMenuLabel className="font-normal px-3 py-2.5">
                    <p className="text-sm font-semibold text-white leading-none">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{user.username}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 text-slate-300 hover:text-white rounded-lg mx-1">
                      <Settings className="mr-2 h-4 w-4 text-slate-500" />Settings
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/subscription">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 text-slate-300 hover:text-white rounded-lg mx-1">
                      <CreditCard className="mr-2 h-4 w-4 text-slate-500" />Subscription
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/documentation">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 text-slate-300 hover:text-white rounded-lg mx-1">
                      <BookOpen className="mr-2 h-4 w-4 text-slate-500" />Documentation
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg mx-1 mb-1"
                  >
                    <LogOut className="mr-2 h-4 w-4" />Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Desktop CTAs */}
                <div className="hidden md:flex items-center gap-1">
                  <Link href="/auth">
                    <span className="h-8 px-3 flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg">
                      Log in
                    </span>
                  </Link>
                  <Link href="/auth">
                    <span className="h-8 px-4 flex items-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-full cursor-pointer transition-colors shadow-md shadow-blue-700/20">
                      Get started
                    </span>
                  </Link>
                </div>

                {/* Mobile toggle */}
                <button
                  className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile menu overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 inset-x-0 z-50 bg-[#070c19] border-b border-slate-800/60 shadow-2xl shadow-black/50"
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between h-14 px-4 border-b border-slate-800/60">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Cloud className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base font-bold text-white">
                    Infra<span className="text-blue-400">Audit</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile links */}
              <div className="p-4 space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto">
                {/* Products section */}
                <div className="pb-3">
                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
                    Products
                  </p>
                  {PRODUCTS.map(({ icon: Icon, label, href, color }) => (
                    <Link key={label} href={href} onClick={() => setMobileOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium text-slate-300">{label}</span>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-slate-800/60" />

                {/* Other links */}
                <div className="py-3 space-y-1">
                  {[
                    { label: "Pricing", href: "/pricing" },
                    { label: "Documentation", href: "/documentation" },
                    { label: "About", href: "/about" },
                  ].map(({ label, href }) => (
                    <Link key={label} href={href} onClick={() => setMobileOpen(false)}>
                      <div className="px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-sm font-medium text-slate-300 hover:text-white">
                        {label}
                      </div>
                    </Link>
                  ))}
                  <a
                    href="https://github.com/pratik-mahalle/InfraAudit"
                    target="_blank"
                    rel="noopener"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-slate-300 hover:text-white"
                  >
                    <Github className="h-4 w-4 text-slate-500" />
                    GitHub
                    <ExternalLink className="h-3 w-3 text-slate-600 ml-auto" />
                  </a>
                </div>

                <div className="h-px bg-slate-800/60" />

                {/* Mobile CTAs */}
                <div className="pt-4 grid grid-cols-2 gap-2">
                  <Link href="/auth" onClick={() => setMobileOpen(false)}>
                    <span className="flex items-center justify-center h-10 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer">
                      Log in
                    </span>
                  </Link>
                  <Link href="/auth" onClick={() => setMobileOpen(false)}>
                    <span className="flex items-center justify-center h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white cursor-pointer transition-colors">
                      Get started
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
