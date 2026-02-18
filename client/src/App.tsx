import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import SecurityMonitoring from "@/pages/SecurityMonitoring";
import CostOptimization from "@/pages/CostOptimization";
import CostPrediction from "@/pages/CostPrediction";
import ResourceUtilization from "@/pages/ResourceUtilization";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import CloudProviders from "@/pages/CloudProviders";
import Documentation from "@/pages/documentation";
import AuthPage from "@/pages/auth-page";
import SignupPage from "@/pages/signup-page";
import HomePage from "@/pages/HomePage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import SubscriptionCancel from "@/pages/SubscriptionCancel";
import PricingPage from "@/pages/pricing";
import KubernetesPage from "@/pages/KubernetesPage";
import ArchitecturePlaygroundPage from "@/pages/architecture-playground";
import AiAnalysisDemo from "@/pages/AiAnalysisDemo";
import RoiCalculator from "@/pages/RoiCalculator";
import Guide from "@/pages/Guide";
import APIPage from "@/pages/API";
import ShareViewer from "@/pages/ShareViewer";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/legal/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/legal/TermsOfServicePage";
import Compliance from "@/pages/Compliance";
import Automation from "@/pages/Automation";
import Recommendations from "@/pages/Recommendations";
import DriftDetectionPage from "@/pages/DriftDetection";
import VulnerabilitiesPage from "@/pages/Vulnerabilities";
import BillingImport from "@/pages/BillingImport";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import ExpiredTrialRedirect from "@/components/trial/ExpiredTrialRedirect";

// Protected routes that don't show footer
const PROTECTED_ROUTES = [
  "/dashboard",
  "/security",
  "/drift-detection",
  "/vulnerabilities",
  "/cost",
  "/cost-prediction",
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
    <Switch>
      {/* Auth pages - no MainLayout */}
      <Route path="/auth">
        <AuthLayout>
          <AuthPage />
        </AuthLayout>
      </Route>
      <Route path="/signup">
        <AuthLayout>
          <SignupPage />
        </AuthLayout>
      </Route>

      {/* All other routes - with MainLayout */}
      <Route path="*">
        <MainLayout showFooter={showFooter}>
          <Switch>
            {/* Protected routes - require authentication */}
            <ProtectedRoute path="/dashboard">
              <WithTrialCheck><Dashboard /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/security">
              <WithTrialCheck><SecurityMonitoring defaultTab="drifts" /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/drift-detection">
              <WithTrialCheck><DriftDetectionPage /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/vulnerabilities">
              <WithTrialCheck><VulnerabilitiesPage /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/recommendations">
              <WithTrialCheck><Recommendations /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/billing-import">
              <WithTrialCheck><BillingImport /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/cost">
              <WithTrialCheck><CostOptimization /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/cost-prediction">
              <WithTrialCheck><CostPrediction /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/resources">
              <WithTrialCheck><ResourceUtilization /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/settings">
              <WithTrialCheck><Settings /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/profile">
              <WithTrialCheck><Profile /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/cloud-providers">
              <WithTrialCheck><CloudProviders /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/kubernetes">
              <WithTrialCheck><KubernetesPage /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/architecture-playground">
              <WithTrialCheck><ArchitecturePlaygroundPage /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/subscription/success">
              <WithTrialCheck><SubscriptionSuccess /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/subscription/cancel">
              <WithTrialCheck><SubscriptionCancel /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/subscription">
              <WithTrialCheck><SubscriptionPage /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/roi-calculator">
              <WithTrialCheck><RoiCalculator /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/compliance">
              <WithTrialCheck><Compliance /></WithTrialCheck>
            </ProtectedRoute>
            <ProtectedRoute path="/automation">
              <WithTrialCheck><Automation /></WithTrialCheck>
            </ProtectedRoute>

            {/* Public routes */}
            <Route path="/" component={HomePage} />
            <Route path="/documentation" component={Documentation} />
            <Route path="/guide" component={Guide} />
            <Route path="/guide/" component={Guide} />
            <Route path="/guides" component={Guide} />
            <Route path="/share/:token" component={ShareViewer} />
            <Route path="/api" component={APIPage} />
            <Route path="/pricing" component={PricingPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/privacy" component={PrivacyPolicyPage} />
            <Route path="/terms" component={TermsOfServicePage} />
            <Route path="/ai-demo" component={AiAnalysisDemo} />

            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
