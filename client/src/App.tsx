import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { PrimeReactProvider } from "primereact/api";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import ExpiredTrialRedirect from "@/components/trial/ExpiredTrialRedirect";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Eagerly loaded pages (critical path)
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/HomePage";

// Lazy-loaded pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SecurityMonitoring = lazy(() => import("@/pages/SecurityMonitoring"));
const CostOptimization = lazy(() => import("@/pages/CostOptimization"));
const CostPrediction = lazy(() => import("@/pages/CostPrediction"));
const ResourceUtilization = lazy(() => import("@/pages/ResourceUtilization"));
const ResourceDetailPage = lazy(() => import("@/components/resources/ResourceDetailPage"));
const Settings = lazy(() => import("@/pages/Settings"));
const Profile = lazy(() => import("@/pages/Profile"));
const CloudProviders = lazy(() => import("@/pages/CloudProviders"));
const Documentation = lazy(() => import("@/pages/documentation"));
const SignupPage = lazy(() => import("@/pages/signup-page"));
const InvitePage = lazy(() => import("@/pages/InvitePage"));
const SubscriptionPage = lazy(() => import("@/pages/SubscriptionPage"));
const SubscriptionSuccess = lazy(() => import("@/pages/SubscriptionSuccess"));
const SubscriptionCancel = lazy(() => import("@/pages/SubscriptionCancel"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const KubernetesPage = lazy(() => import("@/pages/KubernetesPage"));
const ArchitecturePlaygroundPage = lazy(() => import("@/pages/architecture-playground"));
const ResourceAnalysis = lazy(() => import("@/pages/ResourceAnalysis"));
const RoiCalculator = lazy(() => import("@/pages/RoiCalculator"));
const Guide = lazy(() => import("@/pages/Guide"));
const APIPage = lazy(() => import("@/pages/API"));
const ShareViewer = lazy(() => import("@/pages/ShareViewer"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/legal/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("@/pages/legal/TermsOfServicePage"));
const Automation = lazy(() => import("@/pages/Automation"));
const Recommendations = lazy(() => import("@/pages/Recommendations"));
const DriftDetectionPage = lazy(() => import("@/pages/DriftDetection"));
const FindingDetail = lazy(() => import("@/pages/FindingDetail"));
const BillingImport = lazy(() => import("@/pages/BillingImport"));
const BillingExplorer = lazy(() => import("@/pages/BillingExplorer"));
const CostMonitors = lazy(() => import("@/pages/CostMonitors"));
const IaCManagement = lazy(() => import("@/pages/IaCManagement"));
const Alerts = lazy(() => import("@/pages/Alerts"));
const Reports = lazy(() => import("@/pages/Reports"));
const ReportDetail = lazy(() => import("@/pages/ReportDetail"));
const SBOMPage = lazy(() => import("@/pages/SBOMPage"));
const PoliciesPage = lazy(() => import("@/pages/PoliciesPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Protected routes that don't show footer
const PROTECTED_ROUTES = [
  "/dashboard",
  "/security",
  "/drift-detection",
  "/vulnerabilities",
  "/findings",
  "/cost",
  "/cost-prediction",
  "/billing-explorer",
  "/cost-monitors",
  "/resources",
  "/settings",
  "/profile",
  "/cloud-providers",
  "/kubernetes",
  "/architecture-playground",
  "/subscription",
  "/subscription/success",
  "/subscription/cancel",
  "/roi-calculator",
  "/compliance",
  "/automation",
  "/recommendations",
  "/billing-import",
  "/iac",
  "/sbom",
  "/policies",
  "/reports",
  "/alerts",
  "/resource-analysis",
  "/ai-demo",
];

// Check if current path is a protected route
function isProtectedPath(path: string): boolean {
  return PROTECTED_ROUTES.some(route => path === route || path.startsWith(route + "/"));
}

// Wrapper for protected pages with ExpiredTrialRedirect
function WithTrialCheck({ children }: { children: React.ReactNode }) {
  return <ExpiredTrialRedirect>{children}</ExpiredTrialRedirect>;
}

function Router() {
  const [location] = useLocation();

  // Determine if we should show footer based on current route
  const showFooter = !isProtectedPath(location);

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Auth routes (outside MainLayout) */}
        <Route path="/auth" component={AuthPage} />
        <Route path="/auth/callback" component={AuthPage} />
        <Route path="/signup">
          <SignupPage />
        </Route>
        <Route path="/invite/:token">
          <InvitePage />
        </Route>

        {/* All other routes - with MainLayout */}
        <Route path="*">
          <MainLayout showFooter={showFooter}>
            <Suspense fallback={<PageLoader />}>
              <Switch>
                {/* Protected routes - require authentication */}
                <ProtectedRoute path="/dashboard">
                  <WithTrialCheck><Dashboard /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/security">
                  <WithTrialCheck><SecurityMonitoring defaultTab="all" /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/drift-detection">
                  <WithTrialCheck><DriftDetectionPage /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/vulnerabilities">
                  <WithTrialCheck><Redirect to="/security?view=vulnerabilities" /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/findings/:id">
                  <WithTrialCheck><FindingDetail /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/findings">
                  <WithTrialCheck><Redirect to="/security?view=findings" /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/recommendations">
                  <WithTrialCheck><Recommendations /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/billing-import" permission="manage_billing">
                  <WithTrialCheck><BillingImport /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/cost">
                  <WithTrialCheck><CostOptimization /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/billing-explorer">
                  <WithTrialCheck><BillingExplorer /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/cost-monitors">
                  <WithTrialCheck><CostMonitors /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/cost-prediction">
                  <WithTrialCheck><CostPrediction /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/resources/:id">
                  <WithTrialCheck><ResourceDetailPage /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/resources">
                  <WithTrialCheck><ResourceUtilization /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/settings" permission="manage_settings">
                  <WithTrialCheck><Settings /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/profile">
                  <WithTrialCheck><Profile /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/cloud-providers">
                  <WithTrialCheck><CloudProviders /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/kubernetes" permission="manage_providers">
                  <WithTrialCheck><KubernetesPage /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/architecture-playground">
                  <WithTrialCheck><ArchitecturePlaygroundPage /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/subscription/success" permission="manage_billing">
                  <WithTrialCheck><SubscriptionSuccess /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/subscription/cancel" permission="manage_billing">
                  <WithTrialCheck><SubscriptionCancel /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/subscription" permission="manage_billing">
                  <WithTrialCheck><SubscriptionPage /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/roi-calculator">
                  <WithTrialCheck><RoiCalculator /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/compliance">
                  <WithTrialCheck><Redirect to="/security?view=compliance" /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/automation">
                  <WithTrialCheck><Automation /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/iac">
                  <WithTrialCheck><IaCManagement /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/sbom">
                  <WithTrialCheck><SBOMPage /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/policies">
                  <WithTrialCheck><PoliciesPage /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/alerts">
                  <WithTrialCheck><Alerts /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/resource-analysis">
                  <WithTrialCheck><ResourceAnalysis /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/ai-demo">
                  <WithTrialCheck><Redirect to="/resource-analysis" /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/reports/:id">
                  <WithTrialCheck><ReportDetail /></WithTrialCheck>
                </ProtectedRoute>
                <ProtectedRoute path="/reports">
                  <WithTrialCheck><Reports /></WithTrialCheck>
                </ProtectedRoute>

                {/* Public routes */}
                <Route path="/" component={HomePage} />
                <Route path="/documentation">
                  <Documentation />
                </Route>
                <Route path="/guide">
                  <Guide />
                </Route>
                <Route path="/guide/">
                  <Guide />
                </Route>
                <Route path="/guides">
                  <Guide />
                </Route>
                <Route path="/share/:token">
                  <ShareViewer />
                </Route>
                <Route path="/api">
                  <APIPage />
                </Route>
                <Route path="/pricing">
                  <PricingPage />
                </Route>
                <Route path="/about">
                  <AboutPage />
                </Route>
                <Route path="/contact">
                  <ContactPage />
                </Route>
                <Route path="/privacy">
                  <PrivacyPolicyPage />
                </Route>
                <Route path="/terms">
                  <TermsOfServicePage />
                </Route>
                {/* Fallback to 404 */}
                <Route>
                  <NotFound />
                </Route>
              </Switch>
            </Suspense>
          </MainLayout>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <PrimeReactProvider value={{ ripple: true }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <Toaster />
                <Router />
              </ErrorBoundary>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </PrimeReactProvider>
  );
}

export default App;
