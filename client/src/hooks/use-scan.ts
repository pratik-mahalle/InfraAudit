import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import React from "react";

type ScanStatus = {
  id: number;
  status: string;
  driftCount: number;
  resourceCount: number;
  securityScore: number | null;
};

export function useScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [currentReport, setCurrentReport] = useState<ScanStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast, dismiss } = useToast();
  const [, navigate] = useLocation();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startScan = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      // Start the scan
      const response = await apiRequest("POST", "/api/reports/scan");
      const json = await response.json();
      const data = json?.data || json;
      const reportId = data.id;

      if (!reportId) {
        throw new Error("No report ID returned from scan");
      }

      // Show progress toast
      const progressToast = toast({
        title: "Scanning infrastructure...",
        description: "Starting scan, please wait...",
        duration: Infinity,
      });

      // Poll for status
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await apiRequest("GET", `/api/reports/${reportId}/status`);
          const statusJson = await statusRes.json();
          const status: ScanStatus = statusJson?.data || statusJson;

          setCurrentReport(status);

          // Update progress toast
          progressToast.update({
            id: progressToast.id,
            title: "Scanning infrastructure...",
            description: `${status.resourceCount ?? 0} resources found, ${status.driftCount ?? 0} drifts detected`,
            duration: Infinity,
          });

          if (status.status === "completed") {
            stopPolling();
            setIsScanning(false);
            progressToast.dismiss();

            // Invalidate reports list and resources
            queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
            queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
            queryClient.invalidateQueries({ queryKey: ["/api/drifts"] });

            // Show completion toast
            toast({
              title: "Scan completed",
              description: `Found ${status.resourceCount ?? 0} resources and ${status.driftCount ?? 0} drifts. Security score: ${status.securityScore ?? "N/A"}`,
            });

            // Auto-redirect to the report
            navigate(`/reports/${reportId}`);
          } else if (status.status === "failed") {
            stopPolling();
            setIsScanning(false);
            progressToast.dismiss();

            toast({
              title: "Scan failed",
              description: "The infrastructure scan encountered an error.",
              variant: "destructive",
              action: React.createElement(
                ToastAction,
                {
                  altText: "Retry",
                  onClick: () => startScan(),
                },
                "Retry"
              ),
            });
          }
        } catch {
          // Polling error - keep going, might be transient
        }
      }, 2000);
    } catch (err: any) {
      setIsScanning(false);
      toast({
        title: "Failed to start scan",
        description: err?.message || "Could not initiate the scan.",
        variant: "destructive",
        action: React.createElement(
          ToastAction,
          {
            altText: "Retry",
            onClick: () => startScan(),
          },
          "Retry"
        ),
      });
    }
  }, [isScanning, toast, dismiss, navigate, stopPolling]);

  return { startScan, isScanning, currentReport };
}
