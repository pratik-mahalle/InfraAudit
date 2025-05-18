import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Settings, 
  Cloud, 
  AlertTriangle, 
  BarChart3, 
  Shield, 
  Menu, 
  LogOut,
  BookOpen,
  CreditCard,
  TrendingUp,
  FileSpreadsheet,
  Zap
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
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo - aligned left */}
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden md:block">
                InfraAudit
              </span>
            </div>
          </Link>
        </div>

        {/* Main Navigation - centered and evenly spaced */}
        <div className="hidden md:flex items-center justify-center space-x-8 flex-1">
          {user && (
            <>
              <Link 
                href="/dashboard" 
                className={`flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  location === "/dashboard" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                <span>Dashboard</span>
              </Link>
              <Link 
                href="/cost" 
                className={`flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  location === "/cost" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span>Cost</span>
              </Link>
              <Link 
                href="/cost-prediction" 
                className={`flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  location === "/cost-prediction" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                <span>Predictions</span>
              </Link>
              <Link 
                href="/security" 
                className={`flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  location === "/security" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span>Security</span>
              </Link>
              {/* Alerts have been integrated into the Security page */}
              <Link 
                href="/cloud-providers" 
                id="cloud-providers-nav"
                className={`flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  location === "/cloud-providers" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Cloud className="h-4 w-4 flex-shrink-0" />
                <span>Providers</span>
              </Link>
              <Link 
                href="/subscription" 
                className={`flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  location === "/subscription" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="h-4 w-4 flex-shrink-0" />
                <span>Subscription</span>
              </Link>
            </>
          )}
          
          {/* Public links for all users */}
          <a 
            href="/#features" 
            className="flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            <span>Features</span>
          </a>
          <a 
            href="/#pricing" 
            className="flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            <span>Pricing</span>
          </a>
          <a 
            href="/#testimonials" 
            className="flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            <span>Testimonials</span>
          </a>
          <a 
            href="/#faq" 
            className="flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            <span>FAQ</span>
          </a>
        </div>

        {/* User controls and mobile menu */}
        <div className="flex items-center gap-3 ml-auto">
          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" size="icon">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials(user.fullName || user.username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName || user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/subscription">
                  <DropdownMenuItem className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Subscription</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="default" size="sm">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 pb-6 border-t border-border/40 bg-background">
          <div className="px-4 max-w-6xl mx-auto space-y-3">
            {user && (
              <>
                <Link href="/">
                  <div 
                    className={`flex items-center gap-2 py-2 transition-colors cursor-pointer ${
                      location === "/" 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link href="/cost">
                  <div 
                    className={`flex items-center gap-2 py-2 transition-colors cursor-pointer ${
                      location === "/cost" 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 flex-shrink-0" />
                    <span>Cost</span>
                  </div>
                </Link>
                <Link href="/cost-prediction">
                  <div 
                    className={`flex items-center gap-2 py-2 transition-colors cursor-pointer ${
                      location === "/cost-prediction" 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    <span>Predictions</span>
                  </div>
                </Link>
                <Link href="/security">
                  <div 
                    className={`flex items-center gap-2 py-2 transition-colors cursor-pointer ${
                      location === "/security" 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    <span>Security</span>
                  </div>
                </Link>
                {/* Alerts have been integrated into the Security page */}
                <Link href="/cloud-providers">
                  <div 
                    id="cloud-providers-nav-mobile"
                    className={`flex items-center gap-2 py-2 transition-colors cursor-pointer ${
                      location === "/cloud-providers" 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Cloud className="h-4 w-4 flex-shrink-0" />
                    <span>Providers</span>
                  </div>
                </Link>
                <Link href="/subscription">
                  <div 
                    id="subscription-nav-mobile"
                    className={`flex items-center gap-2 py-2 transition-colors cursor-pointer ${
                      location === "/subscription" 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 flex-shrink-0" />
                    <span>Subscription</span>
                  </div>
                </Link>
              </>
            )}
            
            {/* Documentation link (available to all users) */}
            <Link href="/documentation">
              <div 
                id="documentation-nav-mobile"
                className={`flex items-center gap-2 py-2 transition-colors cursor-pointer ${
                  location === "/documentation" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span>Docs</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}