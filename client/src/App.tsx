import { Switch, Route } from "wouter";
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
// Removed Alerts import as it's now integrated into Security
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import CloudProviders from "@/pages/CloudProviders";
import Documentation from "@/pages/documentation";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/HomePage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import SubscriptionCancel from "@/pages/SubscriptionCancel";
import PricingPage from "@/pages/pricing";
import KubernetesPage from "@/pages/KubernetesPage";
import ArchitecturePlaygroundPage from "@/pages/architecture-playground";
import AiAnalysisDemo from "@/pages/AiAnalysisDemo";
import RoiCalculator from "@/pages/RoiCalculator";
// Footer pages
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/legal/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/legal/TermsOfServicePage";
// Removed BillingImport as we've integrated it into CostOptimization
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import ExpiredTrialRedirect from "@/components/trial/ExpiredTrialRedirect";

function Router() {
  // Wrap all protected components with the ExpiredTrialRedirect component
  const ProtectedDashboard = () => (
    <ExpiredTrialRedirect>
      <Dashboard />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedSecurity = () => (
    <ExpiredTrialRedirect>
      <SecurityMonitoring />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedCost = () => (
    <ExpiredTrialRedirect>
      <CostOptimization />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedCostPrediction = () => (
    <ExpiredTrialRedirect>
      <CostPrediction />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedResources = () => (
    <ExpiredTrialRedirect>
      <ResourceUtilization />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedSettings = () => (
    <ExpiredTrialRedirect>
      <Settings />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedProfile = () => (
    <ExpiredTrialRedirect>
      <Profile />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedCloudProviders = () => (
    <ExpiredTrialRedirect>
      <CloudProviders />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedKubernetes = () => (
    <ExpiredTrialRedirect>
      <KubernetesPage />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedSubscription = () => (
    <ExpiredTrialRedirect>
      <SubscriptionPage />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedSubscriptionSuccess = () => (
    <ExpiredTrialRedirect>
      <SubscriptionSuccess />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedSubscriptionCancel = () => (
    <ExpiredTrialRedirect>
      <SubscriptionCancel />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedArchitecturePlayground = () => (
    <ExpiredTrialRedirect>
      <ArchitecturePlaygroundPage />
    </ExpiredTrialRedirect>
  );
  
  const ProtectedRoiCalculator = () => (
    <ExpiredTrialRedirect>
      <RoiCalculator />
    </ExpiredTrialRedirect>
  );
  
  return (
    <Switch>
      {/* Auth page */}
      <Route path="/auth">
        <AuthLayout>
          <AuthPage />
        </AuthLayout>
      </Route>
      
      {/* All other routes - with footer */}
      <Route path="*">
        <MainLayout>
          <Switch>
            {/* Protected routes - require authentication and active trial */}
            <ProtectedRoute path="/dashboard" component={ProtectedDashboard} />
            <ProtectedRoute path="/security" component={ProtectedSecurity} />
            <ProtectedRoute path="/cost" component={ProtectedCost} />
            <ProtectedRoute path="/cost-prediction" component={ProtectedCostPrediction} />
            <ProtectedRoute path="/resources" component={ProtectedResources} />
            {/* Alerts have been integrated into the Security page */}
            <ProtectedRoute path="/settings" component={ProtectedSettings} />
            <ProtectedRoute path="/profile" component={ProtectedProfile} />
            <ProtectedRoute path="/cloud-providers" component={ProtectedCloudProviders} />
            <ProtectedRoute path="/kubernetes" component={ProtectedKubernetes} />
            {/* Billing import has been integrated into the cost optimization page */}
            <ProtectedRoute path="/architecture-playground" component={ProtectedArchitecturePlayground} />
            <ProtectedRoute path="/subscription" component={ProtectedSubscription} />
            <ProtectedRoute path="/subscription/success" component={ProtectedSubscriptionSuccess} />
            <ProtectedRoute path="/subscription/cancel" component={ProtectedSubscriptionCancel} />
            <ProtectedRoute path="/roi-calculator" component={ProtectedRoiCalculator} />
            
            {/* Public routes */}
            <Route path="/" component={HomePage} /> {/* Landing page for non-authenticated users */}
            <Route path="/documentation" component={Documentation} />
            <Route path="/pricing" component={PricingPage} />
            
            {/* Footer pages */}
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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
