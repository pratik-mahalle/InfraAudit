import { useState, useEffect } from "react";
import { Redirect, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface TrialStatusResponse {
  status: "inactive" | "active" | "expired";
  message: string;
  daysRemaining: number;
}

export default function ExpiredTrialRedirect({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [location] = useLocation();
  
  // List of allowed paths even if trial is expired
  const allowedPaths = ["/pricing", "/subscription", "/auth"];
  
  // If current path is already in the allowed paths, don't redirect
  const isAllowedPath = allowedPaths.some(path => location === path || location.startsWith(`${path}/`));
  
  // Check trial status
  const { data: trialStatus } = useQuery<TrialStatusResponse>({
    queryKey: ["/api/trial-status"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/trial-status");
        return await res.json();
      } catch (error) {
        console.error("Error fetching trial status:", error);
        return undefined;
      }
    },
    // Poll every minute to make sure we detect expiry
    refetchInterval: 60 * 1000,
  });
  
  useEffect(() => {
    if (trialStatus) {
      setIsLoading(false);
      
      // If trial is expired and not on an allowed path, force redirect
      if (trialStatus.status === "expired" && !isAllowedPath) {
        setShouldRedirect(true);
      } else {
        setShouldRedirect(false);
      }
    }
  }, [trialStatus, isAllowedPath]);
  
  // During loading, proceed as normal
  if (isLoading) {
    return <>{children}</>;
  }
  
  // If we need to redirect to subscription page
  if (shouldRedirect) {
    return <Redirect to="/pricing" />;
  }
  
  // If we're already on an allowed path or the trial isn't expired
  return <>{children}</>;
}