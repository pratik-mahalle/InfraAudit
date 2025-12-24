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
function TypeWriter({ texts, className }: { texts: string[]; className?: string }) {
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
    }, isDeleting ? 40 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, texts]);

  return (
    <span className={cn("inline-block", className)}>
      {displayText}
      <span className="animate-[cursor-blink_1s_infinite] text-current opacity-80">|</span>
    </span>
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

// AI Brain Visualization Component
function AIBrainVisualization() {
  const [activeThought, setActiveThought] = useState(0);
  const thoughts = [
    { icon: DollarSign, text: "Analyzing cost patterns...", result: "Found $2,340 in savings", color: "text-emerald-500" },
    { icon: Shield, text: "Scanning security configs...", result: "3 misconfigurations detected", color: "text-amber-500" },
    { icon: Cpu, text: "Checking resource usage...", result: "12 instances oversized", color: "text-blue-500" },
    { icon: TrendingUp, text: "Predicting next month...", result: "15% cost increase likely", color: "text-purple-500" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveThought((prev) => (prev + 1) % thoughts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Central AI Core */}
      <div className="relative w-80 h-80 mx-auto">
        {/* Outer rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-blue-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border border-blue-500/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-8 rounded-full border border-dashed border-blue-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Orbiting thought nodes */}
        {thoughts.map((thought, i) => {
          const angle = (i * 90) + (activeThought * 90);
          const radius = 120;
          return (
            <motion.div
              key={i}
              className={cn(
                "absolute w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                i === activeThought 
                  ? "bg-blue-600 shadow-lg shadow-blue-500/30 scale-110" 
                  : "bg-slate-800 opacity-60"
              )}
              style={{
                left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * radius}px - 24px)`,
                top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * radius}px - 24px)`,
              }}
            >
              <thought.icon className="w-5 h-5 text-white" />
            </motion.div>
          );
        })}
        
        {/* Central brain */}
        <div className="absolute inset-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/20">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bot className="w-16 h-16 text-white" />
          </motion.div>
                              </div>
          
        {/* Pulse effect */}
        <motion.div
          className="absolute inset-16 rounded-full bg-blue-500"
          animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
                            </div>
              
      {/* Current thought display */}
      <motion.div
        key={activeThought}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-sm text-slate-300 mb-3">
          <Loader2 className="w-3 h-3 animate-spin" />
          {thoughts[activeThought].text}
                          </div>
        <p className={cn("text-lg font-semibold", thoughts[activeThought].color)}>
          {thoughts[activeThought].result}
        </p>
      </motion.div>
                    </div>
  );
}

// Live Insights Feed
function LiveInsightsFeed() {
  const insights = [
    { time: "2s ago", text: "Detected idle load balancer in us-east-1", type: "warning" },
    { time: "15s ago", text: "Security group sg-0x4f opened to 0.0.0.0/0", type: "critical" },
    { time: "1m ago", text: "Auto-scaled down dev cluster (saved $12/hr)", type: "success" },
    { time: "3m ago", text: "Backup completed for prod-db-primary", type: "info" },
    { time: "5m ago", text: "Reserved instance recommendation: m5.xlarge", type: "savings" },
  ];

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
        >
          <div className={cn(
            "w-2 h-2 rounded-full mt-2 flex-shrink-0",
            insight.type === "critical" && "bg-red-500",
            insight.type === "warning" && "bg-amber-500",
            insight.type === "success" && "bg-emerald-500",
            insight.type === "info" && "bg-blue-500",
            insight.type === "savings" && "bg-purple-500",
          )} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 truncate">{insight.text}</p>
            <p className="text-xs text-slate-500">{insight.time}</p>
                            </div>
        </motion.div>
                          ))}
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
      
      {/* Hero Section - Headroom Style */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden bg-[#faf9f7] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            {/* Large Typography with Typing Effect */}
            <div className="relative mb-8">
              <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black tracking-tight leading-[0.95]">
                <span className="text-gray-300 dark:text-gray-700">CLOUD ON</span>
                <br />
                <span className="text-black-400 dark:text-black-100">
                  <TypeWriter 
                    texts={[
                      "AUTOPILOT",
                      "OBSERVABILITY", 
                      "AUTOMATION",
                      "FINOPS",
                      "INTELLIGENCE",
                      "RELIABILITY"
                    ]} 
                  />
                </span>
              </h1>
            </div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl font-medium text-gray-700 dark:text-gray-300 mb-8 max-w-xl mx-auto"
            >
                          Cut costs. Reduce risk. Sleep better.

            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
            >
              <Button asChild size="lg" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 rounded-full text-white">
                  <Link href="/auth">
                  Get started
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
      
      {/* Meet InfrAudit Section - Clean Modern Design */}
      <section className="py-28 px-6 bg-slate-900 relative overflow-hidden">
        {/* Simple gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20 mb-6">
              Meet InfrAudit
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Your AI-powered
              <br />
              <span className="text-blue-400">cloud assistant</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Monitors your infrastructure 24/7 so you can focus on building
            </p>
          </motion.div>
          
          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Eye,
                title: "Always Watching",
                description: "Continuous monitoring across AWS, Azure, and GCP",
                stat: "24/7",
                statLabel: "Monitoring",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Zap,
                title: "Instant Alerts",
                description: "Get notified immediately when issues are detected",
                stat: "<1s",
                statLabel: "Response",
                color: "from-violet-500 to-purple-500"
              },
              {
                icon: DollarSign,
                title: "Cost Savings",
                description: "AI identifies waste and optimization opportunities",
                stat: "35%",
                statLabel: "Avg. Savings",
                color: "from-emerald-500 to-teal-500"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300"
              >
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4", feature.color)}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 mb-4">{feature.description}</p>
                <div className="pt-4 border-t border-slate-700/50">
                  <span className={cn("text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent", feature.color)}>{feature.stat}</span>
                  <span className="text-slate-500 text-sm ml-2">{feature.statLabel}</span>
                </div>
              </motion.div>
            ))}
              </div>
              
          {/* Live Activity Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-300">Live Activity</span>
                </div>
            <div className="space-y-3">
              {[
                { text: "Detected 3 idle EC2 instances in us-east-1", time: "2s ago", type: "warning" },
                { text: "Security scan completed - All clear", time: "1m ago", type: "success" },
                { text: "Cost anomaly detected: 40% spike in compute", time: "5m ago", type: "alert" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center justify-between py-3 px-4 bg-slate-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      item.type === "warning" && "bg-amber-500",
                      item.type === "success" && "bg-emerald-500",
                      item.type === "alert" && "bg-red-500"
                    )} />
                    <span className="text-slate-300 text-sm">{item.text}</span>
                </div>
                  <span className="text-slate-500 text-xs">{item.time}</span>
                </motion.div>
              ))}
              </div>
          </motion.div>
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
      
      {/* Always thinking for you - Reimagined */}
      <section className="py-24 px-6 bg-slate-950 text-white overflow-hidden relative">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
              <Activity className="w-4 h-4" />
              Always On. Always Learning.
                </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
              Your AI That Never Sleeps
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              While you're away, InfrAudit continuously analyzes your infrastructure, 
              finds optimization opportunities, and keeps everything secure.
            </p>
          </motion.div>
          
          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* AI Brain Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <AIBrainVisualization />
            </motion.div>
            
            {/* Live Insights Feed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-slate-400 font-medium">Live Insights Feed</span>
                </div>
              <LiveInsightsFeed />
              
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">$47K</div>
                  <div className="text-xs text-slate-500">Saved this month</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">248</div>
                  <div className="text-xs text-slate-500">Resources monitored</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">99.9%</div>
                  <div className="text-xs text-slate-500">Uptime maintained</div>
              </div>
            </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section - Modern Cards */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Three steps to cloud clarity
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get started in minutes. No complex setup required.
            </p>
          </motion.div>
          
          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect your cloud",
                description: "Link your AWS, Azure, or GCP accounts with read-only access. Your data never leaves your infrastructure.",
                color: "from-blue-500 to-cyan-500",
                features: ["One-click OAuth", "Read-only access", "SOC2 compliant"]
              },
              {
                step: "02", 
                title: "AI analyzes everything",
                description: "Our AI scans your resources, identifies waste, security gaps, and optimization opportunities in real-time.",
                color: "from-violet-500 to-purple-500",
                features: ["Cost anomalies", "Security risks", "Performance issues"]
              },
              {
                step: "03",
                title: "Act on insights",
                description: "Get actionable recommendations with one-click fixes. Automate remediation or review manually.",
                color: "from-emerald-500 to-teal-500",
                features: ["Auto-remediation", "Slack alerts", "Weekly reports"]
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative group"
              >
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 h-full hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1">
                  {/* Step number with gradient */}
                  <div className={cn(
                    "inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br text-white font-bold text-lg mb-6",
                    item.color
                  )}>
                    {item.step}
                      </div>
                  
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2">
                    {item.features.map((feature, j) => (
                      <span 
                        key={j}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400"
                      >
                        {feature}
                      </span>
                    ))}
                      </div>
                    </div>
                    
                {/* Connector line (except last) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-gray-300 dark:border-gray-700" />
                )}
              </motion.div>
            ))}
                      </div>
          
          {/* Testimonial Card */}
                      </div>
      </section>

      {/* Feature Showcase - Floating Cards */}
      <section className="py-32 px-6 relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto relative min-h-[700px] flex items-center justify-center">
          
          {/* Central Content */}
          <div className="text-center relative z-10 max-w-2xl">
            {/* Logo/Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-16 h-16 mx-auto mb-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20"
            >
              <Cloud className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4"
            >
              Monitor, optimize, and secure
              <br />
              <span className="text-gray-400 dark:text-slate-500">all in one place</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 dark:text-gray-400 text-lg mb-8"
            >
              Unified cloud management that saves you time and money.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Button asChild size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 rounded-full">
                <Link href="/auth">
                  Start for free
                </Link>
              </Button>
            </motion.div>
                    </div>
                    
          {/* Floating Card 1 - Cost Alert (Top Left) */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: -30 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="absolute left-4 lg:left-16 top-8 lg:top-20"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-700 w-56"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                  <p className="font-semibold text-sm">Cost Alert</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unusual spending detected in <span className="font-medium text-amber-600">us-east-1</span>
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs">Dismiss</Button>
                <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600">View</Button>
                  </div>
            </motion.div>
          </motion.div>
          
          {/* Floating Card 2 - Savings (Top Right) */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: -30 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="absolute right-4 lg:right-16 top-16 lg:top-8"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-700 w-52"
            >
              <p className="text-xs text-gray-500 mb-1">Monthly Savings</p>
              <p className="text-3xl font-bold text-emerald-600">$4,280</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">+23% from last month</span>
                </div>
              <div className="mt-3 h-12 flex items-end gap-1">
                {[40, 55, 45, 70, 65, 80, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-500/20 rounded-t"
                    style={{ height: `${h}%` }}
                  >
                    <div 
                      className="w-full bg-emerald-500 rounded-t" 
                      style={{ height: `${h * 0.7}%` }}
                    />
              </div>
                ))}
            </div>
            </motion.div>
          </motion.div>
          
          {/* Floating Card 3 - Sticky Note (Left Middle) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="absolute left-8 lg:left-32 bottom-32 lg:bottom-40 hidden md:block"
          >
            <motion.div
              animate={{ rotate: [-2, 2, -2], y: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="bg-yellow-100 dark:bg-yellow-200 rounded-lg p-4 shadow-lg w-44 transform -rotate-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-400 absolute -top-1 left-1/2 -translate-x-1/2" />
              <p className="text-sm text-yellow-900 font-handwriting leading-relaxed">
                Check idle resources in staging environment before EOD
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-yellow-700">Priority: High</span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Floating Card 4 - Security Scan (Right Middle) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="absolute right-4 lg:right-24 bottom-48 lg:bottom-52 hidden md:block"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-700 w-56"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">Security Scan</p>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs">
                  Passed
                </Badge>
                </div>
              <div className="space-y-2">
                {[
                  { label: "IAM Policies", status: true },
                  { label: "Network ACLs", status: true },
                  { label: "Encryption", status: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
          
          {/* Floating Card 5 - Today's Tasks (Bottom Left) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="absolute left-8 lg:left-48 bottom-4 lg:bottom-8"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-700 w-64"
            >
              <p className="font-semibold text-sm mb-3">Today's Tasks</p>
              <div className="space-y-2">
                {[
                  { task: "Review cost recommendations", progress: 80, color: "bg-blue-500" },
                  { task: "Update security policies", progress: 45, color: "bg-violet-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{item.task}</span>
                      <span className="font-medium">{item.progress}%</span>
                </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.progress}%` }} />
                </div>
              </div>
                ))}
            </div>
            </motion.div>
          </motion.div>
          
          {/* Floating Card 6 - Integrations (Bottom Right) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="absolute right-8 lg:right-40 bottom-4 lg:bottom-16"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-700"
            >
              <p className="font-semibold text-sm mb-3">50+ Integrations</p>
              <div className="flex gap-2">
                {[
                  { bg: "bg-[#FF9900]", label: "AWS" },
                  { bg: "bg-[#0078D4]", label: "Azure" },
                  { bg: "bg-[#4285F4]", label: "GCP" },
                  { bg: "bg-[#326CE5]", label: "K8s" },
                ].map((item, i) => (
                  <div 
                    key={i}
                    className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold", item.bg)}
                  >
                    {item.label.charAt(0)}
          </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
          
        </div>
      </section>
      
      {/* Big Typography Section - Clean & Modern */}
      <section className="py-40 px-6 relative bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]"
          >
            <span className="text-gray-400 dark:text-slate-600">Everything you need to</span>
            <br />
            <TypeWriter 
              texts={[
                "secure your cloud",
                "optimize costs",
                "scale confidently",
                "automate everything",
                "monitor 24/7"
              ]}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent"
            />
            <br />
            <span className="text-gray-400 dark:text-slate-600">your cloud infrastructure</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-8 text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto"
          >
            One platform. All your clouds. Complete visibility.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            {["Cost Optimization", "Security Scanning", "Compliance", "Multi-Cloud", "Real-time Alerts"].map((tag, i) => (
              <span 
                key={i}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700"
              >
                {tag}
              </span>
            ))}
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

      {/* CTA Section - Clean Gradient Design */}
      <section className="py-28 px-6 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to optimize
              <br />
              your cloud?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of DevOps teams already saving time and money with InfrAudit.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button asChild size="lg" className="h-14 px-10 bg-white hover:bg-gray-100 text-blue-700 rounded-full text-lg font-semibold shadow-xl shadow-blue-900/20 transition-all duration-300 hover:scale-105">
                <Link href="/auth">
                  Start free trial
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-10  bg-white hover:bg-gray-100 text-blue-700 rounded-full text-lg font-semibold shadow-xl shadow-blue-900/20 transition-all duration-300 hover:scale-105">
                <Link href="/contact">
                  Talk to sales
                </Link>
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
          
          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { value: "50K+", label: "Resources Monitored" },
              { value: "$2M+", label: "Savings Identified" },
              { value: "99.9%", label: "Uptime SLA" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
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
