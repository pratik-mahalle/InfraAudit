import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Menu,
  X,
  LogOut,
  Settings,
  CreditCard,
  BookOpen,
  Github,
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
import { cn } from "@/lib/utils";
import { AskInfraAudit } from "@/components/ai/AskInfraAudit";

// Simple dropdown item
function NavDropdownItem({
  href,
  children,
  description,
  external,
}: {
  href: string;
  children: React.ReactNode;
  description?: string;
  external?: boolean;
}) {
  const Wrapper = external ? "a" : Link;
  const extraProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper href={href} {...(extraProps as any)}>
      <div className="px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {children}
        </div>
        {description && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
            {description}
          </div>
        )}
      </div>
    </Wrapper>
  );
}

// Lightweight dropdown container
function NavDropdown({
  label,
  children,
  isOpen,
  onToggle,
  onClose,
}: {
  label: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          isOpen
            ? "text-blue-600 dark:text-blue-400"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200/80 dark:border-gray-700/80 p-1.5 z-50",
          "transition-all duration-200 origin-top",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [location] = useLocation();

  // Close everything on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [location]);

  const toggleDropdown = (name: string) =>
    setActiveDropdown((prev) => (prev === name ? null : name));

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <svg
            viewBox="0 0 44 44"
            className="h-8 w-8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="navLogoGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
            <rect width="44" height="44" rx="10" fill="url(#navLogoGrad)" />
            <path
              d="M22 12C18.5 12 15.5 14.5 14.5 17.8C11.5 18.2 9 21 9 24.5C9 28.5 12 31.5 16 31.5H28C31.5 31.5 34.5 28.5 34.5 25C34.5 22 32.2 19.5 29.2 19C28.5 15 25.5 12 22 12Z"
              fill="white"
              fillOpacity="0.95"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-gray-900 dark:text-white">Infra</span>
            <span className="text-blue-600">Audit</span>
          </span>
        </Link>

        {/* Center Nav — public only */}
        {!user && (
          <div className="hidden md:flex items-center gap-0.5">
            {/* Products */}
            <NavDropdown
              label="Products"
              isOpen={activeDropdown === "Products"}
              onToggle={() => toggleDropdown("Products")}
              onClose={() => setActiveDropdown(null)}
            >
              <NavDropdownItem
                href="/auth"
                description="AI-powered cost savings"
              >
                Cost Optimizer
              </NavDropdownItem>
              <NavDropdownItem
                href="/auth"
                description="Drift & misconfiguration detection"
              >
                Security Monitor
              </NavDropdownItem>
              <NavDropdownItem
                href="/auth"
                description="Smart recommendations"
              >
                AI Insights
              </NavDropdownItem>
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
              <NavDropdownItem
                href="/auth"
                description="AWS, Azure, GCP, K8s"
              >
                Cloud Providers
              </NavDropdownItem>
            </NavDropdown>

            {/* Developers */}
            <NavDropdown
              label="Developers"
              isOpen={activeDropdown === "Developers"}
              onToggle={() => toggleDropdown("Developers")}
              onClose={() => setActiveDropdown(null)}
            >
              <NavDropdownItem href="/documentation">
                Documentation
              </NavDropdownItem>
              <NavDropdownItem href="/documentation">
                API Reference
              </NavDropdownItem>
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
              <NavDropdownItem
                href="https://github.com/pratik-mahalle/InfraAudit"
                external
              >
                GitHub
              </NavDropdownItem>
            </NavDropdown>

            {/* Direct links */}
            <Link href="/pricing">
              <span className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                Pricing
              </span>
            </Link>
            <Link href="/about">
              <span className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                About
              </span>
            </Link>
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {user && <AskInfraAudit />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                  size="icon"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials(user.fullName || user.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <Link href="/subscription">
                  <DropdownMenuItem className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscription
                  </DropdownMenuItem>
                </Link>
                <Link href="/documentation">
                  <DropdownMenuItem className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Documentation
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-sm font-medium h-8"
              >
                <Link href="/auth">Log in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-8 text-sm"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-slate-950",
          mobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0 border-t-0"
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {user ? (
            <>
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/cost", label: "Cost Analysis" },
                { href: "/security", label: "Security" },
                { href: "/cloud-providers", label: "Cloud Providers" },
                { href: "/settings", label: "Settings" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {item.label}
                  </div>
                </Link>
              ))}
              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              {[
                { href: "/auth", label: "Products" },
                { href: "/documentation", label: "Documentation" },
                { href: "/pricing", label: "Pricing" },
                { href: "/about", label: "About" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {item.label}
                  </div>
                </Link>
              ))}
              <a
                href="https://github.com/pratik-mahalle/InfraAudit"
                target="_blank"
                rel="noopener"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </div>
              </a>
              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
              <div className="flex gap-2 pt-1">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                >
                  <Link
                    href="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-700"
                >
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
