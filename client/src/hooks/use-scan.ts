import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "sonner";

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
      const response = await apiRequest("POST", "/api/reports/scan");
      const json = await response.json();
      const data = json?.data || json;
      const reportId = data.id;

      if (!reportId) {
        throw new Error("No report ID returned from scan");
      }

      toast.loading("Scanning infrastructure...", { id: "scan-progress" });

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await apiRequest("GET", `/api/reports/${reportId}/status`);
          const statusJson = await statusRes.json();
          const status: ScanStatus = statusJson?.data || statusJson;

          setCurrentReport(status);

          toast.loading(
            `${status.resourceCount ?? 0} resources found, ${status.driftCount ?? 0} drifts detected`,
            { id: "scan-progress" }
          );

          if (status.status === "completed") {
            stopPolling();
            setIsScanning(false);

            queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
            queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
            queryClient.invalidateQueries({ queryKey: ["/api/drifts"] });

            toast.success(
              `Found ${status.resourceCount ?? 0} resources and ${status.driftCount ?? 0} drifts. Security score: ${status.securityScore ?? "N/A"}`,
              { id: "scan-progress" }
            );

            navigate(`/reports/${reportId}`);
          } else if (status.status === "failed") {
            stopPolling();
            setIsScanning(false);

            toast.error("The infrastructure scan encountered an error.", {
              id: "scan-progress",
              action: { label: "Retry", onClick: () => startScan() },
            });
          }
        } catch {
          // Polling error - keep going, might be transient
        }
      }, 2000);
    } catch (err: any) {
      setIsScanning(false);
      toast.error(err?.message || "Could not initiate the scan.", {
        action: { label: "Retry", onClick: () => startScan() },
      });
    }
  }, [isScanning, navigate, stopPolling]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { startScan, isScanning, currentReport };
}
