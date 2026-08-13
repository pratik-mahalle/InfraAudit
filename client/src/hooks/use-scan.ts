import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient, unwrapResponse } from "@/lib/queryClient";
import { toast } from "sonner";

type ScanStatus = {
  id: number;
  status: string;
  queueJobId?: number | null;
  stage?: string;
  progressPercent?: number;
  totalDrifts: number;
  totalResources: number;
  errorMessage?: string;
};

const stageLabel = (stage?: string) =>
  (stage || "queued")
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

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
      const data = unwrapResponse<{ id?: number }>(json);
      const reportId = data.id;

      if (!reportId) {
        throw new Error("No report ID returned from scan");
      }

      toast.loading("Scanning infrastructure...", { id: "scan-progress" });

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await apiRequest("GET", `/api/reports/${reportId}/status`);
          const statusJson = await statusRes.json();
          const status = unwrapResponse<ScanStatus>(statusJson);

          setCurrentReport(status);

          toast.loading(
            `${stageLabel(status.stage)} (${status.progressPercent ?? 0}%) - ${status.totalResources ?? 0} resources, ${status.totalDrifts ?? 0} drifts`,
            { id: "scan-progress" }
          );

          if (status.status === "completed") {
            stopPolling();
            setIsScanning(false);

            queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            queryClient.invalidateQueries({ queryKey: ["drifts"] });

            toast.success(
              `Found ${status.totalResources ?? 0} resources and ${status.totalDrifts ?? 0} drifts.`,
              { id: "scan-progress" }
            );

            navigate(`/reports/${reportId}`);
          } else if (status.status === "failed" || status.status === "cancelled") {
            stopPolling();
            setIsScanning(false);

            toast.error(status.errorMessage || "The infrastructure scan did not complete.", {
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
