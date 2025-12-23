import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  BarChart3,
  Shield,
  DollarSign,
  LineChart,
  ArrowRight,
  ChevronRight,
  Plus,
  Sparkles,
  Zap,
  Cloud,
  Lock,
  Bell,
  TrendingUp,
  Globe,
  Server,
  Database,
  Cpu,
  Eye,
  Target,
  Rocket,
  Star,
  Play,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Settings,
  AlertTriangle,
  Activity,
  Loader2,
  Search,
  Home,
  Building2,
  FolderKanban,
  MessageSquare,
  FileText,
  Smartphone,
  Bot,
  Mail
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// Marquee component for infinite scroll
function Marquee({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex overflow-hidden", className)}>
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

// Animated typing effect
function TypeWriter({ texts }: { texts: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[currentIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? 30 : 80);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, texts]);

  return (
    <span className="text-blue-600">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// Premium Globe Illustration with Network Effect
function CloudIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-auto">
        <defs>
          {/* Gradient for the globe */}
          <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#2563eb" stopOpacity="1" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
          </linearGradient>
          
          {/* Glow effect */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Inner shadow */}
          <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feOffset dy="2" dx="2" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
            <feFlood floodColor="#1e3a8a" floodOpacity="0.3" />
            <feComposite in2="shadowDiff" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>
        </defs>
        
        {/* Outer glow ring */}
        <circle cx="200" cy="200" r="145" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.2" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.1" />
        
        {/* Main globe */}
        <circle cx="200" cy="200" r="130" fill="url(#globeGradient)" filter="url(#innerShadow)" />
        
        {/* Grid lines - horizontal */}
        {[0.3, 0.5, 0.7].map((pos, i) => (
          <ellipse
            key={`h-${i}`}
            cx="200"
            cy={200 + (pos - 0.5) * 200}
            rx={130 * Math.sqrt(1 - Math.pow(pos - 0.5, 2) * 4)}
            ry="8"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
        ))}
        
        {/* Grid lines - vertical */}
        <ellipse cx="200" cy="200" rx="40" ry="130" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <ellipse cx="200" cy="200" rx="80" ry="130" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <ellipse cx="200" cy="200" rx="130" ry="130" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        
        {/* Central dashboard card */}
        <g filter="url(#glow)">
          <rect x="155" y="155" width="90" height="70" rx="12" fill="#1e40af" />
          <rect x="155" y="155" width="90" height="70" rx="12" fill="rgba(255,255,255,0.1)" />
          
          {/* Card content - lines */}
          <rect x="167" y="170" width="45" height="6" rx="3" fill="rgba(255,255,255,0.4)" />
          <rect x="167" y="182" width="55" height="6" rx="3" fill="rgba(255,255,255,0.25)" />
          <rect x="167" y="194" width="35" height="6" rx="3" fill="rgba(255,255,255,0.25)" />
          
          {/* Status indicators */}
          <circle cx="225" cy="173" r="4" fill="#22c55e" />
          <circle cx="225" cy="185" r="4" fill="#22c55e" />
          <circle cx="225" cy="197" r="4" fill="#eab308" />
        </g>
        
        {/* Floating nodes - AWS */}
        <motion.g
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="95" cy="140" r="20" fill="#ff9900" />
          <text x="95" y="145" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">λ</text>
        </motion.g>
        
        {/* Floating nodes - Azure */}
        <motion.g
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <circle cx="305" cy="160" r="18" fill="#0078d4" />
          <path d="M297 160 L305 152 L313 160 L305 168 Z" fill="white" />
        </motion.g>
        
        {/* Floating nodes - GCP */}
        <motion.g
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <circle cx="120" cy="280" r="16" fill="#4285f4" />
          <circle cx="120" cy="280" r="6" fill="white" />
        </motion.g>
        
        {/* Floating nodes - Kubernetes */}
        <motion.g
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        >
          <circle cx="290" cy="270" r="17" fill="#326ce5" />
          <path d="M290 258 L296 266 L296 278 L290 286 L284 278 L284 266 Z" fill="white" fillOpacity="0.9" />
        </motion.g>
        
        {/* Connection lines */}
        <motion.line
          x1="115" y1="140" x2="155" y2="175"
          stroke="rgba(255,153,0,0.4)"
          strokeWidth="2"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [0, -16] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.line
          x1="287" y1="160" x2="245" y2="180"
          stroke="rgba(0,120,212,0.4)"
          strokeWidth="2"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [0, -16] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.3 }}
        />
        <motion.line
          x1="136" y1="275" x2="165" y2="220"
          stroke="rgba(66,133,244,0.4)"
          strokeWidth="2"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [0, -16] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.6 }}
        />
        <motion.line
          x1="273" y1="265" x2="240" y2="215"
          stroke="rgba(50,108,229,0.4)"
          strokeWidth="2"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [0, -16] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.9 }}
        />
        
        {/* Orbiting particle */}
        <motion.circle
          cx="200"
          cy="200"
          r="6"
          fill="#60a5fa"
          filter="url(#glow)"
          animate={{
            cx: [200, 330, 200, 70, 200],
            cy: [70, 200, 330, 200, 70],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
}

// AI Agent Illustration for Meet section
function AIAgentIllustration() {
  return (
    <div className="relative">
      <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
        <defs>
          <linearGradient id="agentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <filter id="agentGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="rgba(255,255,255,0.1)" />
        <circle cx="100" cy="100" r="80" fill="rgba(255,255,255,0.05)" />
        
        {/* Robot head */}
        <rect x="55" y="50" width="90" height="75" rx="16" fill="white" />
        
        {/* Antenna */}
        <motion.g
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: "100px 50px" }}
        >
          <line x1="100" y1="50" x2="100" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="25" r="6" fill="#60a5fa" filter="url(#agentGlow)" />
        </motion.g>
        
        {/* Eyes */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          <rect x="70" y="70" width="20" height="20" rx="4" fill="#1e40af" />
          <rect x="110" y="70" width="20" height="20" rx="4" fill="#1e40af" />
          
          {/* Eye glow */}
          <rect x="73" y="73" width="8" height="8" rx="2" fill="#60a5fa" />
          <rect x="113" y="73" width="8" height="8" rx="2" fill="#60a5fa" />
        </motion.g>
        
        {/* Mouth - scanning line */}
        <motion.rect
          x="75" y="100"
          width="50" height="6"
          rx="3"
          fill="#3b82f6"
          animate={{ opacity: [0.5, 1, 0.5], width: [30, 50, 30], x: [85, 75, 85] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Body */}
        <rect x="65" y="130" width="70" height="45" rx="12" fill="white" />
        
        {/* Chest indicator */}
        <motion.circle
          cx="100" cy="152"
          r="10"
          fill="#3b82f6"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <circle cx="100" cy="152" r="5" fill="white" />
        
        {/* Side panels */}
        <rect x="45" y="140" width="15" height="25" rx="4" fill="rgba(255,255,255,0.8)" />
        <rect x="140" y="140" width="15" height="25" rx="4" fill="rgba(255,255,255,0.8)" />
        
        {/* Signal waves */}
        <motion.circle
          cx="100" cy="100" r="95"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
          animate={{ r: [95, 110], opacity: [0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="100" cy="100" r="95"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
          animate={{ r: [95, 110], opacity: [0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
        />
      </svg>
      
      {/* Floating data points */}
      <motion.div
        className="absolute top-4 right-0 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-white text-xs"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        scanning...
      </motion.div>
                              </div>
  );
}

// Product Demo Card - Dashboard Preview
function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Cloud className="w-4 h-4 text-white" />
                              </div>
            <span className="font-medium text-sm">InfrAudit</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Provider
          </Button>
          <div className="flex -space-x-2">
            {["O", "C", "M"].map((letter, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-900">
                {letter}
                              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium border-2 border-white dark:border-gray-900">
              +7
                            </div>
                          </div>
                    </div>
                        </div>
                        
      {/* Sidebar + Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-100 dark:border-gray-800 p-4 hidden md:block">
          <nav className="space-y-1">
            {[
              { icon: Home, label: "Dashboard", active: true },
              { icon: Server, label: "Resources" },
              { icon: Shield, label: "Security" },
              { icon: DollarSign, label: "Costs" },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                  item.active
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                            </div>
                          ))}
          </nav>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-400 mb-2 px-3">PROVIDERS</p>
            <nav className="space-y-1">
              {[
                { label: "AWS", color: "bg-[#FF9900]" },
                { label: "Azure", color: "bg-[#0078D4]" },
                { label: "GCP", color: "bg-[#4285F4]" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className={cn("w-3 h-3 rounded-sm", item.color)} />
                  {item.label}
                    </div>
              ))}
            </nav>
            </div>
          </div>
          
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Cloud Resources</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                12 Alerts
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                248 Resources
              </Badge>
              </div>
            </div>
            
          {/* Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Resource</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Provider</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Status<Badge variant="secondary" className="ml-1 text-[10px] px-1">AI</Badge>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Cost<Badge variant="secondary" className="ml-1 text-[10px] px-1">AI</Badge>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { name: "prod-api-server", provider: "AWS", providerColor: "bg-[#FF9900]", status: "Healthy", statusColor: "text-green-600", cost: "$142/mo" },
                  { name: "analytics-db", provider: "GCP", providerColor: "bg-[#4285F4]", status: "Warning", statusColor: "text-amber-600", cost: "$89/mo" },
                  { name: "cdn-assets", provider: "Azure", providerColor: "bg-[#0078D4]", status: "Healthy", statusColor: "text-green-600", cost: "$34/mo" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-sm", row.providerColor)} />
                        {row.provider}
              </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("font-medium", row.statusColor)}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3">{row.cost}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            
          {/* AI Scanning Notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
              </div>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              InfrAudit is scanning for cost optimization opportunities...
            </span>
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin ml-auto" />
          </motion.div>
            </div>
              </div>
    </motion.div>
  );
}

// AI Thinking Card Component
function AIThinkingCard() {
  const [thinkingStates, setThinkingStates] = useState({
    cost: "Analyzing...",
    security: "Checking...",
    action: "Thinking..."
  });

  useEffect(() => {
    const timer1 = setTimeout(() => setThinkingStates(prev => ({ ...prev, cost: "$2,340 potential savings" })), 2000);
    const timer2 = setTimeout(() => setThinkingStates(prev => ({ ...prev, security: "3 vulnerabilities found" })), 3500);
    const timer3 = setTimeout(() => setThinkingStates(prev => ({ ...prev, action: "Rightsize 12 instances" })), 5000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 max-w-md">
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500">Monthly Cost</span>
          <div className="flex items-center gap-2">
            {thinkingStates.cost === "Analyzing..." ? (
              <>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-gray-400">Analyzing...</span>
              </>
            ) : (
              <span className="font-semibold text-green-600">{thinkingStates.cost}</span>
            )}
                </div>
                </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500">Security Status</span>
          <div className="flex items-center gap-2">
            {thinkingStates.security === "Checking..." ? (
              <>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-gray-400">Checking...</span>
              </>
            ) : (
              <span className="font-semibold text-amber-600">{thinkingStates.security}</span>
            )}
              </div>
                </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500">Recommended action</span>
          <div className="flex items-center gap-2">
            {thinkingStates.action === "Thinking..." ? (
              <>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-gray-400">Thinking...</span>
              </>
            ) : (
              <span className="font-semibold text-blue-600">{thinkingStates.action}</span>
            )}
                </div>
              </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-gray-500">Assigned to</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
              O
                </div>
            <span className="font-medium">Olivia Chen</span>
                </div>
              </div>
            </div>
    </div>
  );
}

// Feature Badge Component
function FeatureBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <span className="font-medium">{label}</span>
      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                </div>
  );
}

// Animated Task List
function AnimatedTaskList() {
  const tasks = [
    "Detected 3 idle EC2 instances",
    "Found unused EBS volumes",
    "Identified over-provisioned RDS",
    "Flagged public S3 bucket",
    "Analyzed cost anomaly spike",
    "Generated savings report",
    "Scheduled resource cleanup",
    "Sent Slack notification",
  ];

  return (
    <div className="space-y-3">
      {tasks.map((task, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className={cn(
            "text-white/90",
            i > 4 && "text-white/60"
          )}>
            {task}
          </span>
        </motion.div>
      ))}
              </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            {/* Large Typography with Illustration */}
            <div className="relative mb-8">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight text-gray-200 dark:text-gray-800 leading-none">
                CLOUD ON
                <br />
                AUTOPILOT
              </h1>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <CloudIllustration />
                </div>
              </div>
              
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-8"
            >
              Powerful AI that monitors your cloud so you don't have to
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button asChild variant="outline" size="lg" className="h-12 px-6 rounded-full">
                <a href="https://github.com/pratik-mahalle/InfraAudit" target="_blank" rel="noopener">
                  View on GitHub
                </a>
              </Button>
              <Button asChild size="lg" className="h-12 px-6 bg-blue-600 hover:bg-blue-700 rounded-full">
                <Link href="/auth">
                  Get access now
                </Link>
              </Button>
            </motion.div>

            {/* AI Prompt Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-center gap-2">
                Connect your cloud, get instant insights
                <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400">?</span>
              </p>
              <div className="relative">
                <Textarea
                  placeholder="I need to optimize my AWS costs and find security vulnerabilities..."
                  className="min-h-[80px] pr-24 rounded-xl border-gray-300 dark:border-gray-700 resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <Button 
                  className="absolute bottom-3 right-3 rounded-lg"
                  onClick={() => setLocation("/auth")}
                >
                  Analyze
                </Button>
                </div>
            </motion.div>
              </div>
            </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <DashboardPreview />
          
          {/* Marquee */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-400 mb-4">Trusted by DevOps teams worldwide</p>
            <Marquee className="py-4">
              {["AWS", "Azure", "GCP", "Kubernetes", "Terraform", "Docker", "Jenkins", "GitHub"].map((item) => (
                <span key={item} className="text-gray-300 dark:text-gray-600 text-lg font-medium px-4">
                  {item}
                </span>
              ))}
            </Marquee>
          </div>
        </div>
      </section>
      
      {/* Meet InfrAudit Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-blue-200 mb-2 font-medium">Meet InfrAudit</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your AI assistant that monitors your cloud 24/7,
              <br />
              so you can focus on building
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <AIAgentIllustration />
            </motion.div>

            <AnimatedTaskList />
                      </div>
                      </div>
      </section>

      {/* All your cloud handled section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
                      <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                All your cloud complexity,
                <br />
                handled by InfrAudit
              </h2>
              
              <div className="grid grid-cols-3 gap-6 mt-12">
                {[
                  { icon: Zap, text: "InfrAudit quickly takes action for you, because manual monitoring is slow" },
                  { icon: Eye, text: "InfrAudit tracks, follows up, and alerts you while you build features" },
                  { icon: Shield, text: "Rest easy knowing your infrastructure is secure without constant checking" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.text}</p>
                      </div>
                ))}
                    </div>
                  </div>

            <DashboardPreview />
                </div>
              </div>
      </section>

      {/* Always thinking for you */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Always thinking for you
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                InfrAudit enriches your infrastructure data and helps you make smarter decisions.
              </p>
              </div>
              
            <div className="flex gap-6">
              <AIThinkingCard />
              
              <div className="space-y-4 w-48">
                <FeatureBadge icon={Users} label="Collaborative" />
                <FeatureBadge icon={Smartphone} label="Mobile friendly" />
                <FeatureBadge icon={Bot} label="Powered by AI" />
                </div>
                </div>
              </div>
                </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Manage any workflow */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-2">Manage any workflow</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our AI-powered workflows help you manage any process, from alerts to remediation.
              </p>
              <div className="space-y-3">
                {[
                  { label: "5 cost alerts pending", color: "border-amber-500" },
                  { label: "2 security scans running", color: "border-blue-500" },
                  { label: "1 optimization applied", color: "border-green-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn("w-4 h-4 rounded-full border-2", item.color)} />
                    <span className="text-sm">{item.label}</span>
                </div>
                ))}
              </div>
            </div>

            {/* One Platform */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 text-center">
              <div className="h-32 flex items-center justify-center mb-4">
                <div className="relative">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-blue-600 rounded-full"
                      style={{
                        left: `${Math.cos(i * 30 * Math.PI / 180) * 40}px`,
                        top: `${Math.sin(i * 30 * Math.PI / 180) * 40}px`,
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity,
                      }}
                    />
                  ))}
          </div>
        </div>
              <h3 className="text-xl font-bold mb-2">One Platform</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All your cloud providers and data live together. No more juggling dashboards.
            </p>
          </div>
          
            {/* Always in the loop */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-2">Always in the loop</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Send notifications to teammates automatically.
              </p>
              <div className="space-y-2">
                {[
                  "Your cost alert was triggered",
                  "Security scan completed",
                  "New optimization available",
                  "Monthly report ready",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <Mail className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                    </div>
                ))}
                  </div>
                </div>
          </div>
        </div>
      </section>

      {/* Big Typography Section */}
      <section className="py-24 px-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-gray-200 dark:text-gray-800 text-center leading-tight">
            EVERYTHING
            <br />
            YOU NEED TO
            <br />
            <span className="relative inline-block">
              SECURE
              <motion.span
                className="absolute -bottom-2 left-0 w-full h-1 bg-blue-600"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              />
            </span>
            {" "}YOUR
            <br />
            CLOUD
          </h2>
          
          {/* 3D Shield with Cloud */}
          <motion.div
            className="absolute right-4 md:right-12 lg:right-24 top-1/2 -translate-y-1/2"
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 180 220" className="w-36 h-44 md:w-48 md:h-60">
              <defs>
                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <filter id="shieldShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#1d4ed8" floodOpacity="0.3" />
                </filter>
              </defs>
              
              {/* Shield shape */}
              <path
                d="M90 10 L160 40 L160 100 C160 160 90 200 90 200 C90 200 20 160 20 100 L20 40 Z"
                fill="url(#shieldGradient)"
                filter="url(#shieldShadow)"
              />
              
              {/* Shield highlight */}
              <path
                d="M90 20 L145 45 L145 100 C145 150 90 185 90 185"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              
              {/* Cloud icon inside shield */}
              <g transform="translate(45, 70)">
                <path
                  d="M75 45 C75 35 67 27 55 27 C48 27 42 31 39 37 C32 37 25 43 25 52 C25 61 32 68 42 68 L68 68 C76 68 82 62 82 54 C82 48 79 45 75 45 Z"
                  fill="white"
                  opacity="0.95"
                />
                
                {/* Check mark */}
                <motion.path
                  d="M42 50 L50 58 L68 40"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </g>
              
              {/* Decorative lines */}
              <motion.circle
                cx="90" cy="110" r="60"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                animate={{ r: [60, 70], opacity: [0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </svg>
          </motion.div>
          
          {/* Floating elements */}
          <motion.div
            className="absolute left-8 md:left-20 top-20"
            animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
          </motion.div>
          
          <motion.div
            className="absolute left-16 md:left-32 bottom-20"
            animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Saves hours section */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              InfrAudit saves hours of work for you and your team
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: "Instant insights",
                description: "Unlock insights and decisions from your infrastructure data instantly"
              },
              {
                icon: Target,
                title: "Smart routing",
                description: "Route tasks to the right person, automatically based on expertise"
              },
              {
                icon: Shield,
                title: "Human in the loop",
                description: "Critical decisions, always reviewed by a human when it matters"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Start free, scale as you grow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-2">Community</h3>
              <p className="text-gray-500 mb-4">Self-hosted, free forever</p>
              <div className="text-4xl font-bold mb-6">$0</div>
              <Button asChild variant="outline" className="w-full mb-6">
                <a href="https://github.com/pratik-mahalle/InfraAudit" target="_blank">
                  Deploy Self-Hosted
                </a>
              </Button>
              <ul className="space-y-3 text-sm">
                {["Core features", "Community support", "MIT License"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
                </ul>
            </Card>
            
            {/* Pro Plan */}
            <Card className="p-6 border-2 border-blue-600 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                Most Popular
              </Badge>
                <h3 className="text-xl font-bold mb-2">Professional</h3>
              <p className="text-gray-500 mb-4">For growing teams</p>
              <div className="text-4xl font-bold mb-6">$299<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <Button asChild className="w-full mb-6 bg-blue-600 hover:bg-blue-700">
                <Link href="/auth">Start Free Trial</Link>
                </Button>
              <ul className="space-y-3 text-sm">
                {["Up to 500 resources", "AI recommendations", "Slack integration", "Priority support"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
                </ul>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 px-6 bg-gray-900 dark:bg-slate-950">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to begin?
          </h2>
            <p className="text-gray-400 mb-8">
              Sign up for our early access program to get started. We'll be in touch soon to talk about your infrastructure needs.
            </p>
            <Button asChild size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 rounded-full">
              <Link href="/auth">
                Get early access
              </Link>
            </Button>
          </motion.div>
          </div>
      </section>

      {/* Testimonial Footer */}
      <section className="py-16 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <blockquote className="text-center">
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 italic mb-6">
              "I never imagined having a tool that's fully customized to how we manage our cloud. InfrAudit is a game changer for our DevOps team."
            </p>
            <footer>
              <div className="font-semibold">Aarav Shah, DevOps Lead</div>
              <div className="text-sm text-gray-500">Using InfrAudit for 5 months</div>
            </footer>
          </blockquote>
        </div>
      </section>
    </div>
  );
}
