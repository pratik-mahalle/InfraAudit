import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

type TrialStatus = "inactive" | "active" | "expired";

interface TrialStatusResponse {
  status: TrialStatus;
  message: string;
  daysRemaining: number;
}

export default function TrialBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create a default status if the API call fails
  const [fallbackStatus, setFallbackStatus] = useState<TrialStatusResponse | null>(null);
  
  // Check if user has trial fields and create fallback status
  useEffect(() => {
    if (user) {
      // Create a fallback status based on user data
      if (user.trialStatus === "expired") {
        setFallbackStatus({
          status: "expired",
          message: "Your 7-day trial has expired. Upgrade to continue using InfraAudit.",
          daysRemaining: 0
        });
      } else if (user.trialStatus === "active" && user.trialStartedAt) {
        // Calculate days remaining
        const trialStartDate = new Date(user.trialStartedAt);
        const currentDate = new Date();
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const daysElapsed = Math.floor((currentDate.getTime() - trialStartDate.getTime()) / millisecondsPerDay);
        const daysRemaining = Math.max(0, 7 - daysElapsed);
        
        setFallbackStatus({
          status: "active",
          message: `You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in your trial.`,
          daysRemaining
        });
      } else {
        setFallbackStatus({
          status: "inactive",
          message: "Trial not started yet",
          daysRemaining: 7
        });
      }
    }
  }, [user]);
  
  const { data: trialStatus, isLoading, error } = useQuery<TrialStatusResponse>({
    queryKey: ["/api/trial-status"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/trial-status");
        return await res.json();
      } catch (error) {
        console.error("Error fetching trial status:", error);
        // Return fallback status if API call fails
        if (fallbackStatus) {
          return fallbackStatus;
        }
        throw error;
      }
    },
    // Don't fetch if user is not authenticated
    enabled: !!user,
    // Refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000
  });
  
  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/start-trial");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Trial Started",
        description: "Your 7-day free trial has been activated.",
        variant: "default",
      });
      
      // Refresh trial status
      queryClient.invalidateQueries({ queryKey: ["/api/trial-status"] });
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Trial",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  // Handle start trial button click
  const handleStartTrial = () => {
    startTrialMutation.mutate();
  };
  
  // If we're still loading and don't have fallback status, don't render anything
  if (isLoading && !fallbackStatus) return null;
  
  // Use either API response or fallback status
  const status = trialStatus || fallbackStatus;
  
  // If we still don't have status information, don't render anything
  if (!status) return null;
  
  if (status.status === "inactive") {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 mb-4">
        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-300">Start Your Free Trial</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-blue-700 dark:text-blue-300">
            Get full access to InfraAudit for 7 days. No credit card required.
          </span>
          <Button 
            onClick={handleStartTrial} 
            disabled={startTrialMutation.isPending}
            className="ml-4"
          >
            {startTrialMutation.isPending ? "Starting..." : "Start 7-Day Trial"}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (status.status === "active") {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50 mb-4">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-800 dark:text-green-300">Trial Active</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-green-700 dark:text-green-300">
            {status.message}
          </span>
          {status.daysRemaining <= 2 && (
            <Button asChild variant="outline" className="ml-4 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800">
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (status.status === "expired") {
    return (
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 mb-4">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-300">Trial Expired</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-amber-700 dark:text-amber-300">
            {status.message}
          </span>
          <Button asChild className="ml-4">
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}