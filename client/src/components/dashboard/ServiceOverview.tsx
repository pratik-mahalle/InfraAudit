import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Cloud, 
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Box
} from "lucide-react";

interface CloudService {
  id: string;
  name: string;
  provider: "aws" | "azure" | "gcp" | "kubernetes";
  resourceCount: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  cost: number;
  costTrend: number;
}

interface ServiceOverviewProps {
  services?: CloudService[];
  isLoading?: boolean;
}

const defaultServices: CloudService[] = [
  {
    id: "1",
    name: "AWS",
    provider: "aws",
    resourceCount: 324,
    healthyCount: 298,
    warningCount: 22,
    criticalCount: 4,
    cost: 12450,
    costTrend: 5.2
  },
  {
    id: "2",
    name: "Azure",
    provider: "azure",
    resourceCount: 156,
    healthyCount: 148,
    warningCount: 6,
    criticalCount: 2,
    cost: 8320,
    costTrend: -2.1
  },
  {
    id: "3",
    name: "GCP",
    provider: "gcp",
    resourceCount: 89,
    healthyCount: 85,
    warningCount: 3,
    criticalCount: 1,
    cost: 4150,
    costTrend: 8.4
  },
  {
    id: "4",
    name: "Kubernetes",
    provider: "kubernetes",
    resourceCount: 278,
    healthyCount: 265,
    warningCount: 11,
    criticalCount: 2,
    cost: 0,
    costTrend: 0
  }
];

// Custom SVG icons for cloud providers
const AwsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.415-.287-.807-.414l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167z"/>
  </svg>
);

const AzureIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.483 21.3H24L14.025 4.013l-3.038 8.347 5.836 6.938L5.483 21.3zM13.23 2.7L6.105 8.677 0 19.253h5.505v.014L13.23 2.7z"/>
  </svg>
);

const GcpIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.19 2.38a9.344 9.344 0 0 0-9.234 6.893c.053-.02-.055.013 0 0-3.875 2.551-3.922 8.11-.247 10.941l.006-.007-.007.03a6.717 6.717 0 0 0 4.077 1.356h5.173l.03-.03h5.192c6.687.053 9.376-8.605 3.835-12.35a9.365 9.365 0 0 0-8.825-6.833zm.141 2.67c2.467-.004 4.798 1.295 6.073 3.447l-1.81 1.81a6.682 6.682 0 0 0-4.263-2.587v2.67a4.014 4.014 0 0 1 3.53 3.53h-3.53v2.67h3.53a4.014 4.014 0 0 1-3.53 3.53v2.67a6.682 6.682 0 0 0 5.06-3.584l1.81 1.81c-1.275 2.152-3.606 3.451-6.073 3.447H7.28a4.014 4.014 0 0 1-4.014-4.014 4.014 4.014 0 0 1 4.014-4.014h.03V9.374a6.682 6.682 0 0 0-3.56 1.973L1.94 9.537c1.275-2.152 3.606-3.451 6.073-3.447h4.318z"/>
  </svg>
);

const KubernetesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.204 14.35l.007.01-.999 2.413a5.171 5.171 0 0 1-2.075-2.597l2.578-.437.004.005a.44.44 0 0 1 .484.606zm-.833-2.129a.44.44 0 0 0 .173-.756l.002-.011L7.585 9.7a5.143 5.143 0 0 0-.73 3.255l2.514-.725.002-.009zm1.145-1.98a.44.44 0 0 0 .699-.337l.01-.005.15-2.62a5.144 5.144 0 0 0-3.01 1.442l2.147 1.523.004-.002zm.76 2.75l.006.006.97 2.015a5.185 5.185 0 0 0 2.088-1.169l-2.238-1.5-.006.003a.44.44 0 0 1-.82.645zm1.674-1.87a.44.44 0 0 0 .163.754l.008.003.875 2.123a5.185 5.185 0 0 0 .771-3.065l-1.83.178.013.007zm-.63-2.098a.44.44 0 0 0-.166-.752l-.006-.004L9.74 6.05a5.185 5.185 0 0 0-1.655 2.65l2.237.346.003-.004zm2.098 1.192l-.015-.01-2.14 1.438.006.008a.44.44 0 0 1 .82.645l-.007-.006.97-2.015a.44.44 0 0 1 .366-.06zm-.618-3.36l.003.002-.15 2.62a.44.44 0 0 1 .699.337l.01.005 2.147-1.523a5.144 5.144 0 0 0-3.01-1.442l.3.001zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5.92 12.88a6.68 6.68 0 0 1-.957 1.97 6.68 6.68 0 0 1-1.618 1.457 6.68 6.68 0 0 1-2.118.88 6.68 6.68 0 0 1-2.454 0 6.68 6.68 0 0 1-2.118-.88 6.68 6.68 0 0 1-1.618-1.458 6.68 6.68 0 0 1-.957-1.97 6.68 6.68 0 0 1 0-2.76 6.68 6.68 0 0 1 .957-1.97 6.68 6.68 0 0 1 1.618-1.457 6.68 6.68 0 0 1 2.118-.88 6.68 6.68 0 0 1 2.454 0 6.68 6.68 0 0 1 2.118.88 6.68 6.68 0 0 1 1.618 1.458 6.68 6.68 0 0 1 .957 1.97 6.68 6.68 0 0 1 0 2.76z"/>
  </svg>
);

const getProviderIcon = (provider: CloudService["provider"]) => {
  const iconClass = "h-6 w-6";
  switch (provider) {
    case "aws":
      return <AwsIcon className={cn(iconClass, "text-[#FF9900]")} />;
    case "azure":
      return <AzureIcon className={cn(iconClass, "text-[#0078D4]")} />;
    case "gcp":
      return <GcpIcon className={cn(iconClass, "text-[#4285F4]")} />;
    case "kubernetes":
      return <KubernetesIcon className={cn(iconClass, "text-[#326CE5]")} />;
  }
};

const getProviderGradient = (provider: CloudService["provider"]) => {
  switch (provider) {
    case "aws":
      return "from-[#FF9900]/20 to-[#FF9900]/5";
    case "azure":
      return "from-[#0078D4]/20 to-[#0078D4]/5";
    case "gcp":
      return "from-[#4285F4]/20 to-[#4285F4]/5";
    case "kubernetes":
      return "from-[#326CE5]/20 to-[#326CE5]/5";
  }
};

function ServiceCard({ service, index }: { service: CloudService; index: number }) {
  const healthPercentage = Math.round((service.healthyCount / service.resourceCount) * 100);
  const gradient = getProviderGradient(service.provider);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group cursor-pointer"
    >
      <Card className={cn(
        "relative overflow-hidden border border-gray-200/60 dark:border-slate-800/60",
        "bg-gradient-to-br",
        gradient,
        "hover:shadow-lg transition-all duration-300"
      )}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-12 translate-x-12 opacity-50" />
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                {getProviderIcon(service.provider)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {service.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {service.resourceCount} resources
                </p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                healthPercentage >= 90 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                  : healthPercentage >= 75 
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    : "bg-red-500/10 text-red-600 border-red-500/30"
              )}
            >
              {healthPercentage}% healthy
            </Badge>
          </div>
          
          {/* Status indicators */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center gap-1.5 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {service.healthyCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {service.warningCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {service.criticalCount}
              </span>
            </div>
          </div>
          
          {/* Health bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Health Status</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{healthPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  healthPercentage >= 90 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                    : healthPercentage >= 75 
                      ? "bg-gradient-to-r from-amber-500 to-amber-400"
                      : "bg-gradient-to-r from-red-500 to-red-400"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${healthPercentage}%` }}
                transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: "easeOut" }}
              />
            </div>
          </div>
          
          {/* Cost info (if applicable) */}
          {service.cost > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Monthly Cost</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    ${service.cost.toLocaleString()}
                  </span>
                  <span className={cn(
                    "text-xs flex items-center",
                    service.costTrend > 0 ? "text-red-500" : "text-emerald-500"
                  )}>
                    {service.costTrend > 0 ? "+" : ""}{service.costTrend}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ServiceOverview({ services = defaultServices, isLoading = false }: ServiceOverviewProps) {
  const totalResources = services.reduce((sum, s) => sum + s.resourceCount, 0);
  const totalHealthy = services.reduce((sum, s) => sum + s.healthyCount, 0);
  const totalCost = services.reduce((sum, s) => sum + s.cost, 0);
  const overallHealth = Math.round((totalHealthy / totalResources) * 100);

  return (
    <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              Multi-Cloud Overview
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalResources} total resources • ${totalCost.toLocaleString()}/month
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs px-3 py-1",
                overallHealth >= 90 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
              )}
            >
              {overallHealth}% Overall Health
            </Badge>
            <Button size="sm" variant="outline" className="gap-1">
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
