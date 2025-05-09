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
  const getBackgroundColor = () => {
    switch (variant) {
      case "primary":
        return "bg-primary bg-opacity-5 hover:bg-opacity-10 text-primary";
      case "secondary":
        return "bg-secondary bg-opacity-5 hover:bg-opacity-10 text-secondary";
      case "warning":
        return "bg-warning bg-opacity-5 hover:bg-opacity-10 text-warning";
      case "danger":
        return "bg-danger bg-opacity-5 hover:bg-opacity-10 text-danger";
      default:
        return "bg-primary bg-opacity-5 hover:bg-opacity-10 text-primary";
    }
  };

  return (
    <Button
      variant="ghost"
      className={`w-full flex items-center justify-between rounded-lg px-4 py-3 ${getBackgroundColor()}`}
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
      const res = await apiRequest("POST", "/api/run-scan", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Scan completed",
        description: `Found ${data.summary.securityDrifts} security drifts and ${data.summary.costAnomalies} cost anomalies`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/security-drifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    },
    onError: (error) => {
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
    <Card>
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
