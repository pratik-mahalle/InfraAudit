import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ShieldCheck, DollarSign, HardDrive, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary" | "warning" | "danger";
}

function QuickActionButton({ icon, label, onClick, variant }: QuickActionButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30";
      case "secondary":
        return "text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20";
      case "warning":
        return "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20";
      case "danger":
        return "text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20";
      default:
        return "text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30";
    }
  };

  return (
    <Button
      variant="ghost"
      className={`w-full flex items-center justify-between rounded-lg px-4 py-3 transition-colors border border-transparent hover:border-foreground/10 ${getVariantClasses()}`}
      onClick={onClick}
    >
      <span className="flex items-center">
        {icon}
        <span className="font-medium ml-3">{label}</span>
      </span>
      <ChevronRight className="h-5 w-5" />
    </Button>
  );
}

export function QuickActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const runScanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/drifts/detect");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Scan completed",
        description: "Drift detection finished successfully.",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/drifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/costs/anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    },
    onError: () => {
      toast({
        title: "Scan failed",
        description: "Could not complete the security scan",
        variant: "destructive",
      });
    },
  });

  const handleRunSecurityScan = () => {
    toast({
      title: "Security scan started",
      description: "Scanning infrastructure for security configuration drifts...",
    });
    runScanMutation.mutate();
  };

  const handleCostOptimization = () => {
    toast({
      title: "Cost optimization",
      description: "Analyzing resources for cost optimization opportunities...",
    });
  };

  const handleUnusedResources = () => {
    toast({
      title: "Unused resources",
      description: "Identifying unused cloud resources...",
    });
  };

  const handleConfigureAlerts = () => {
    toast({
      title: "Configure alerts",
      description: "Opening alert configuration...",
    });
  };

  return (
    <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-inter">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <QuickActionButton
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Run Security Scan"
          onClick={handleRunSecurityScan}
          variant="primary"
        />
        <QuickActionButton
          icon={<DollarSign className="h-5 w-5" />}
          label="Cost Optimization"
          onClick={handleCostOptimization}
          variant="secondary"
        />
        <QuickActionButton
          icon={<HardDrive className="h-5 w-5" />}
          label="Unused Resources"
          onClick={handleUnusedResources}
          variant="warning"
        />
        <QuickActionButton
          icon={<Bell className="h-5 w-5" />}
          label="Configure Alerts"
          onClick={handleConfigureAlerts}
          variant="danger"
        />
      </CardContent>
    </Card>
  );
}
