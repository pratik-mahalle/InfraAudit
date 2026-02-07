import { useAuth } from "@/hooks/use-auth";

/**
 * TrialBanner — currently a no-op since the Go backend doesn't have
 * /api/trial-status or /api/start-trial endpoints yet.
 * Once those are added, re-enable the trial logic.
 */
export default function TrialBanner() {
  const { user } = useAuth();

  // Don't render anything until the backend has trial endpoints
  // to avoid broken API calls and error toasts
  return null;
}
