/**
 * ExpiredTrialRedirect — disabled because the Go backend does not have
 * a /api/trial-status endpoint yet. Once the backend implements trial
 * management, this component can be re-enabled.
 *
 * For now it simply renders its children without any trial checks.
 */
export default function ExpiredTrialRedirect({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}