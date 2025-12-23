import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Settings, 
  Cloud, 
  BarChart3, 
  Shield, 
  Menu, 
  LogOut,
  BookOpen,
  CreditCard,
  TrendingUp,
  Server,
  Layers,
  Github,
  ChevronDown,
  Zap,
  DollarSign,
  Eye,
  Target,
  Users,
  Building2,
  Headphones,
  FileText,
  Code,
  Cpu,
  Database,
  X,
  ArrowRight,
  AlertTriangle,
  Activity,
  Bell,
  LineChart,
  PieChart,
  Wallet,
  Lock,
  Key,
  Globe,
  Terminal,
  Webhook,
  MessageSquare,
  Mail,
  Slack,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Settings2,
  Sparkles
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
import { cn } from "@/lib/utils";

// Mega Menu Item
function MegaMenuItem({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon?: any }) {
  return (
    <Link href={href}>
      <span className="flex items-center gap-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </span>
    </Link>
  );
}

// Featured Product Item
function FeaturedItem({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: any }) {
  return (
    <Link href={href}>
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
        </div>
      </div>
    </Link>
  );
}

// Category Header
function CategoryHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">{children}</h4>
  );
}

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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

  // Mega Menu Dropdown Component
  const MegaMenuDropdown = ({ 
    label, 
    isOpen, 
    onToggle, 
    children 
  }: { 
    label: string; 
    isOpen: boolean; 
    onToggle: () => void; 
    children: React.ReactNode 
  }) => (
    <div 
      className="relative"
      onMouseEnter={() => setActiveDropdown(label)}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg",
          isOpen 
            ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30" 
            : "text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="InfraAudit"
              className="h-10 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {user ? (
            // Authenticated Navigation
            <>
              <Link href="/dashboard">
                <span className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  location === "/dashboard" 
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30" 
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}>
                  Dashboard
                </span>
              </Link>

              {/* Analytics Mega Menu */}
              <MegaMenuDropdown 
                label="Analytics" 
                isOpen={activeDropdown === "Analytics"}
                onToggle={() => setActiveDropdown(activeDropdown === "Analytics" ? null : "Analytics")}
              >
                <div className="p-6 w-[600px]">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <CategoryHeader>Cost Management</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/cost" icon={DollarSign}>Cost Analysis</MegaMenuItem>
                        <MegaMenuItem href="/cost-prediction" icon={TrendingUp}>Predictions</MegaMenuItem>
                        <MegaMenuItem href="/billing-import" icon={Upload}>Billing Import</MegaMenuItem>
                      </div>
                    </div>
                    <div>
                      <CategoryHeader>Monitoring</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/resource-utilization" icon={Activity}>Resource Utilization</MegaMenuItem>
                        <MegaMenuItem href="/alerts" icon={Bell}>Alerts</MegaMenuItem>
                        <MegaMenuItem href="/ai-analysis" icon={Sparkles}>AI Analysis</MegaMenuItem>
                      </div>
                    </div>
                    <div>
                      <CategoryHeader>Reports</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/dashboard" icon={PieChart}>Overview</MegaMenuItem>
                        <MegaMenuItem href="/cost" icon={LineChart}>Trends</MegaMenuItem>
                        <MegaMenuItem href="/cost" icon={Download}>Export</MegaMenuItem>
                      </div>
                    </div>
                  </div>
                </div>
              </MegaMenuDropdown>

              {/* Infrastructure Mega Menu */}
              <MegaMenuDropdown 
                label="Infrastructure" 
                isOpen={activeDropdown === "Infrastructure"}
                onToggle={() => setActiveDropdown(activeDropdown === "Infrastructure" ? null : "Infrastructure")}
              >
                <div className="p-6 w-[700px]">
                  <div className="grid grid-cols-4 gap-6">
                    {/* Featured */}
                    <div className="col-span-1 pr-6 border-r border-gray-200 dark:border-gray-700">
                      <CategoryHeader>Featured</CategoryHeader>
                      <div className="space-y-3">
                        <FeaturedItem 
                          href="/cloud-providers" 
                          title="Multi-Cloud" 
                          description="AWS, Azure, GCP" 
                          icon={Cloud} 
                        />
                        <FeaturedItem 
                          href="/kubernetes" 
                          title="Kubernetes" 
                          description="K8s monitoring" 
                          icon={Cpu} 
                        />
                        <FeaturedItem 
                          href="/architecture-playground" 
                          title="Designer" 
                          description="Visual architect" 
                          icon={Layers} 
                        />
                      </div>
                    </div>
                    
                    {/* Cloud Providers */}
                    <div>
                      <CategoryHeader>Cloud Providers</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/cloud-providers">Amazon Web Services</MegaMenuItem>
                        <MegaMenuItem href="/cloud-providers">Microsoft Azure</MegaMenuItem>
                        <MegaMenuItem href="/cloud-providers">Google Cloud</MegaMenuItem>
                        <MegaMenuItem href="/cloud-providers">All Providers</MegaMenuItem>
                      </div>
                    </div>
                    
                    {/* Kubernetes */}
                    <div>
                      <CategoryHeader>Kubernetes</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/kubernetes">Clusters</MegaMenuItem>
                        <MegaMenuItem href="/kubernetes">Workloads</MegaMenuItem>
                        <MegaMenuItem href="/kubernetes">Cost Allocation</MegaMenuItem>
                        <MegaMenuItem href="/kubernetes">Optimization</MegaMenuItem>
                      </div>
                    </div>
                    
                    {/* Tools */}
                    <div>
                      <CategoryHeader>Tools</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/architecture-playground" icon={Layers}>Architecture Designer</MegaMenuItem>
                        <MegaMenuItem href="/cloud-providers" icon={RefreshCw}>Sync Resources</MegaMenuItem>
                        <MegaMenuItem href="/settings" icon={Settings2}>Integrations</MegaMenuItem>
                      </div>
                    </div>
                  </div>
                </div>
              </MegaMenuDropdown>

              <Link href="/security">
                <span className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  location === "/security" 
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30" 
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}>
                  Security
                </span>
              </Link>

              <Link href="/subscription">
                <span className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  location === "/subscription" 
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30" 
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}>
                  Billing
                </span>
              </Link>
            </>
          ) : (
            // Public Navigation
            <>
              {/* Products Mega Menu */}
              <MegaMenuDropdown 
                label="Products" 
                isOpen={activeDropdown === "Products"}
                onToggle={() => setActiveDropdown(activeDropdown === "Products" ? null : "Products")}
              >
                <div className="p-6 w-[900px]">
                  <div className="grid grid-cols-4 gap-6">
                    {/* Featured Products */}
                    <div className="col-span-1 pr-6 border-r border-gray-200 dark:border-gray-700">
                      <CategoryHeader>Featured Products</CategoryHeader>
                      <div className="space-y-2">
                        <FeaturedItem 
                          href="/auth" 
                          title="Cost Optimizer" 
                          description="AI-powered savings" 
                          icon={DollarSign} 
                        />
                        <FeaturedItem 
                          href="/auth" 
                          title="Security Monitor" 
                          description="Drift detection" 
                          icon={Shield} 
                        />
                        <FeaturedItem 
                          href="/auth" 
                          title="Kubernetes" 
                          description="K8s cost analytics" 
                          icon={Cpu} 
                        />
                        <FeaturedItem 
                          href="/auth" 
                          title="AI Insights" 
                          description="Smart recommendations" 
                          icon={Sparkles} 
                        />
                        <FeaturedItem 
                          href="/auth" 
                          title="Architecture Designer" 
                          description="Visual cloud design" 
                          icon={Layers} 
                        />
                      </div>
                    </div>
                    
                    {/* Cost Management */}
                    <div>
                      <CategoryHeader>Cost Management</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/auth">Cost Analysis</MegaMenuItem>
                        <MegaMenuItem href="/auth">Budget Alerts</MegaMenuItem>
                        <MegaMenuItem href="/auth">Cost Allocation</MegaMenuItem>
                        <MegaMenuItem href="/auth">Billing Integration</MegaMenuItem>
                        <MegaMenuItem href="/auth">Savings Plans</MegaMenuItem>
                      </div>
                      
                      <CategoryHeader>AI & Predictions</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/auth">Cost Forecasting</MegaMenuItem>
                        <MegaMenuItem href="/auth">Anomaly Detection</MegaMenuItem>
                        <MegaMenuItem href="/auth">Smart Recommendations</MegaMenuItem>
                      </div>
                    </div>
                    
                    {/* Security & Compliance */}
                    <div>
                      <CategoryHeader>Security & Compliance</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/auth">Security Scanning</MegaMenuItem>
                        <MegaMenuItem href="/auth">Drift Detection</MegaMenuItem>
                        <MegaMenuItem href="/auth">Compliance Reports</MegaMenuItem>
                        <MegaMenuItem href="/auth">Policy Management</MegaMenuItem>
                        <MegaMenuItem href="/auth">Vulnerability Alerts</MegaMenuItem>
                      </div>
                      
                      <CategoryHeader>Infrastructure</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/auth">Resource Inventory</MegaMenuItem>
                        <MegaMenuItem href="/auth">Multi-Cloud View</MegaMenuItem>
                        <MegaMenuItem href="/auth">Utilization Metrics</MegaMenuItem>
                      </div>
                    </div>
                    
                    {/* Integrations */}
                    <div>
                      <CategoryHeader>Cloud Providers</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/auth">AWS</MegaMenuItem>
                        <MegaMenuItem href="/auth">Azure</MegaMenuItem>
                        <MegaMenuItem href="/auth">Google Cloud</MegaMenuItem>
                        <MegaMenuItem href="/auth">Kubernetes</MegaMenuItem>
                      </div>
                      
                      <CategoryHeader>Notifications</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/auth" icon={Slack}>Slack</MegaMenuItem>
                        <MegaMenuItem href="/auth" icon={Mail}>Email</MegaMenuItem>
                        <MegaMenuItem href="/auth" icon={Webhook}>Webhooks</MegaMenuItem>
                      </div>
                    </div>
                  </div>
                </div>
              </MegaMenuDropdown>

              {/* Solutions Dropdown */}
              <MegaMenuDropdown 
                label="Solutions" 
                isOpen={activeDropdown === "Solutions"}
                onToggle={() => setActiveDropdown(activeDropdown === "Solutions" ? null : "Solutions")}
              >
                <div className="p-6 w-[500px]">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <CategoryHeader>By Company Size</CategoryHeader>
                      <div className="space-y-2">
                        <FeaturedItem 
                          href="/auth" 
                          title="Startups" 
                          description="Scale efficiently from day one" 
                          icon={Zap} 
                        />
                        <FeaturedItem 
                          href="/auth" 
                          title="Enterprise" 
                          description="Enterprise-grade compliance" 
                          icon={Building2} 
                        />
                      </div>
                    </div>
                    <div>
                      <CategoryHeader>By Team</CategoryHeader>
                      <div className="space-y-2">
                        <FeaturedItem 
                          href="/auth" 
                          title="DevOps" 
                          description="Automate cloud operations" 
                          icon={Terminal} 
                        />
                        <FeaturedItem 
                          href="/auth" 
                          title="FinOps" 
                          description="Cloud financial management" 
                          icon={Wallet} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </MegaMenuDropdown>

              {/* Developers Dropdown */}
              <MegaMenuDropdown 
                label="Developers" 
                isOpen={activeDropdown === "Developers"}
                onToggle={() => setActiveDropdown(activeDropdown === "Developers" ? null : "Developers")}
              >
                <div className="p-6 w-[400px]">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <CategoryHeader>Resources</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="/documentation" icon={BookOpen}>Documentation</MegaMenuItem>
                        <MegaMenuItem href="/documentation" icon={FileText}>API Reference</MegaMenuItem>
                        <MegaMenuItem href="/documentation" icon={Terminal}>CLI Guide</MegaMenuItem>
                      </div>
                    </div>
                    <div>
                      <CategoryHeader>Community</CategoryHeader>
                      <div className="space-y-1">
                        <MegaMenuItem href="https://github.com/pratik-mahalle/InfraAudit" icon={Github}>GitHub</MegaMenuItem>
                        <MegaMenuItem href="/documentation" icon={MessageSquare}>Discussions</MegaMenuItem>
                        <MegaMenuItem href="/documentation" icon={Headphones}>Support</MegaMenuItem>
                      </div>
                    </div>
                  </div>
                </div>
              </MegaMenuDropdown>

              {/* Pricing - Direct Link */}
              <Link href="/pricing">
                <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors cursor-pointer">
                  Pricing
                </span>
              </Link>
            </>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" size="icon">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(user.fullName || user.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
                <Link href="/documentation">
                  <DropdownMenuItem className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Documentation</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-sm font-medium">
                <Link href="/auth">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4">
                <Link href="/auth">Sign up</Link>
              </Button>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-6 space-y-6">
            {user ? (
              <>
                {/* Authenticated Mobile Menu */}
                <div className="space-y-1">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <LayoutDashboard className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Dashboard</span>
                    </div>
                  </Link>
                </div>

                <div>
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Analytics</p>
                  <div className="space-y-1">
                    <Link href="/cost" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <DollarSign className="h-5 w-5 text-gray-500" />
                        <span>Cost Analysis</span>
                      </div>
                    </Link>
                    <Link href="/cost-prediction" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <TrendingUp className="h-5 w-5 text-gray-500" />
                        <span>Predictions</span>
                      </div>
                    </Link>
                    <Link href="/resource-utilization" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Activity className="h-5 w-5 text-gray-500" />
                        <span>Resource Utilization</span>
                      </div>
                    </Link>
                  </div>
                </div>

                <div>
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Infrastructure</p>
                  <div className="space-y-1">
                    <Link href="/cloud-providers" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Cloud className="h-5 w-5 text-gray-500" />
                        <span>Cloud Providers</span>
                      </div>
                    </Link>
                    <Link href="/kubernetes" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Cpu className="h-5 w-5 text-gray-500" />
                        <span>Kubernetes</span>
                      </div>
                    </Link>
                    <Link href="/architecture-playground" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Layers className="h-5 w-5 text-gray-500" />
                        <span>Architecture Designer</span>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link href="/security" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Shield className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Security</span>
                    </div>
                  </Link>
                  <Link href="/subscription" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <CreditCard className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Billing</span>
                    </div>
                  </Link>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Settings className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Settings</span>
                    </div>
                  </Link>
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Public Mobile Menu */}
                <div>
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Products</p>
                  <div className="space-y-1">
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span>Cost Optimization</span>
                      </div>
                    </Link>
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span>Security Monitoring</span>
                      </div>
                    </Link>
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Cpu className="h-5 w-5 text-blue-600" />
                        <span>Kubernetes</span>
                      </div>
                    </Link>
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <span>AI Insights</span>
                      </div>
                    </Link>
                  </div>
                </div>

                <div>
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Solutions</p>
                  <div className="space-y-1">
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Zap className="h-5 w-5 text-gray-500" />
                        <span>For Startups</span>
                      </div>
                    </Link>
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Building2 className="h-5 w-5 text-gray-500" />
                        <span>For Enterprise</span>
                      </div>
                    </Link>
                  </div>
                </div>
                
                <div>
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resources</p>
                  <div className="space-y-1">
                    <Link href="/documentation" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <BookOpen className="h-5 w-5 text-gray-500" />
                        <span>Documentation</span>
                      </div>
                    </Link>
                    <a 
                      href="https://github.com/pratik-mahalle/InfraAudit" 
                      target="_blank" 
                      rel="noopener"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Github className="h-5 w-5 text-gray-500" />
                        <span>GitHub</span>
                      </div>
                    </a>
                    <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <CreditCard className="h-5 w-5 text-gray-500" />
                        <span>Pricing</span>
                      </div>
                    </Link>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                  </Button>
                  <Button asChild className="w-full justify-center bg-blue-600 hover:bg-blue-700">
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
