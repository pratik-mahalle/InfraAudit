import { useState, useEffect } from "react";
import { Redirect } from "wouter";
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
  
  // Check trial status
  const { data: trialStatus } = useQuery<TrialStatusResponse>({
    queryKey: ["/api/trial-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/trial-status");
      return await res.json();
    },
    // Poll every minute to make sure we detect expiry
    refetchInterval: 60 * 1000,
  });
  
  useEffect(() => {
    if (trialStatus) {
      setIsLoading(false);
      
      // If trial is expired, redirect to upgrade page
      if (trialStatus.status === "expired") {
        setShouldRedirect(true);
      } else {
        setShouldRedirect(false);
      }
    }
  }, [trialStatus]);
  
  // Show loading spinner while checking trial status - use a less intrusive approach
  if (isLoading) {
    // If we're still loading, just render the children
    // This prevents a disruptive loading screen
    return <>{children}</>;
  }
  
  // Redirect to upgrade page if trial expired
  if (shouldRedirect) {
    return <Redirect to="/pricing" />;
  }
  
  // If trial is active or not started, show the children
  return <>{children}</>;
}