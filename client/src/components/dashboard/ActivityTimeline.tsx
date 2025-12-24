import React from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  DollarSign, 
  Server, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Zap,
  Cloud,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ActivityEvent {
  id: string;
  type: "security" | "cost" | "resource" | "alert" | "scan" | "deployment";
  title: string;
  description: string;
  timestamp: Date;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  status?: "success" | "warning" | "error" | "pending";
}

interface ActivityTimelineProps {
  events?: ActivityEvent[];
  maxItems?: number;
}

const defaultEvents: ActivityEvent[] = [
  {
    id: "1",
    type: "scan",
    title: "Infrastructure Scan Complete",
    description: "Scanned 847 resources across 3 cloud providers",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    status: "success"
  },
  {
    id: "2",
    type: "security",
    title: "Security Drift Detected",
    description: "S3 bucket policy changed - public access enabled",
    timestamp: new Date(Date.now() - 1000 * 60 * 23),
    severity: "critical",
    status: "warning"
  },
  {
    id: "3",
    type: "cost",
    title: "Cost Anomaly Alert",
    description: "EC2 spending increased 47% in us-east-1",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    severity: "high",
    status: "warning"
  },
  {
    id: "4",
    type: "resource",
    title: "New Resources Discovered",
    description: "12 new EC2 instances provisioned in eu-west-1",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: "success"
  },
  {
    id: "5",
    type: "deployment",
    title: "Terraform Apply Completed",
    description: "Infrastructure changes deployed successfully",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    status: "success"
  },
  {
    id: "6",
    type: "alert",
    title: "Alert Resolved",
    description: "Memory utilization normalized on prod-api-server",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    status: "success"
  }
];

const getEventIcon = (type: ActivityEvent["type"], status?: ActivityEvent["status"]) => {
  const iconClass = "h-4 w-4";
  
  switch (type) {
    case "security":
      return <Shield className={iconClass} />;
    case "cost":
      return <DollarSign className={iconClass} />;
    case "resource":
      return <Server className={iconClass} />;
    case "alert":
      return status === "success" ? <CheckCircle2 className={iconClass} /> : <AlertTriangle className={iconClass} />;
    case "scan":
      return <Zap className={iconClass} />;
    case "deployment":
      return <Cloud className={iconClass} />;
    default:
      return <Clock className={iconClass} />;
  }
};

const getEventColors = (type: ActivityEvent["type"], status?: ActivityEvent["status"], severity?: ActivityEvent["severity"]) => {
  if (status === "error" || severity === "critical") {
    return {
      bg: "bg-red-500/10 dark:bg-red-500/20",
      border: "border-red-500/30",
      icon: "text-red-500",
      line: "bg-red-500/50"
    };
  }
  if (status === "warning" || severity === "high") {
    return {
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      border: "border-amber-500/30",
      icon: "text-amber-500",
      line: "bg-amber-500/50"
    };
  }
  if (status === "success") {
    return {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      border: "border-emerald-500/30",
      icon: "text-emerald-500",
      line: "bg-emerald-500/50"
    };
  }
  
  switch (type) {
    case "security":
      return {
        bg: "bg-violet-500/10 dark:bg-violet-500/20",
        border: "border-violet-500/30",
        icon: "text-violet-500",
        line: "bg-violet-500/50"
      };
    case "cost":
      return {
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        border: "border-blue-500/30",
        icon: "text-blue-500",
        line: "bg-blue-500/50"
      };
    default:
      return {
        bg: "bg-slate-500/10 dark:bg-slate-500/20",
        border: "border-slate-500/30",
        icon: "text-slate-500",
        line: "bg-slate-500/50"
      };
  }
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export function ActivityTimeline({ events = defaultEvents, maxItems = 6 }: ActivityTimelineProps) {
  const displayEvents = events.slice(0, maxItems);

  return (
    <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="relative">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            Activity Timeline
          </CardTitle>
          <Badge variant="outline" className="text-xs font-normal">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[340px] px-6 pb-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-slate-300 dark:via-slate-700 to-transparent" />
            
            <div className="space-y-4">
              {displayEvents.map((event, index) => {
                const colors = getEventColors(event.type, event.status, event.severity);
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex gap-4 group"
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      "relative z-10 flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-300",
                      colors.bg,
                      colors.border,
                      "group-hover:scale-110 group-hover:shadow-lg"
                    )}>
                      <span className={colors.icon}>
                        {getEventIcon(event.type, event.status)}
                      </span>
                    </div>
                    
                    {/* Event content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                            {event.description}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>
                      
                      {event.severity && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "mt-2 text-xs capitalize",
                            event.severity === "critical" && "border-red-500/50 text-red-600 dark:text-red-400 bg-red-500/10",
                            event.severity === "high" && "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10",
                            event.severity === "medium" && "border-yellow-500/50 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
                            event.severity === "low" && "border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                          )}
                        >
                          {event.severity}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

