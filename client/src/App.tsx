import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MainLayout } from "@/layouts/MainLayout";
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
// Removed BillingImport as we've integrated it into CostOptimization
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { 
  OnboardingProvider, 
  OnboardingTour, 
  WelcomeModal, 
  HelpButton 
} from "@/components/onboarding";
import ExpiredTrialRedirect from "@/components/trial/ExpiredTrialRedirect";

function Router() {
  return (
    <Switch>
      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/security" component={SecurityMonitoring} />
      <ProtectedRoute path="/cost" component={CostOptimization} />
      <ProtectedRoute path="/cost-prediction" component={CostPrediction} />
      <ProtectedRoute path="/resources" component={ResourceUtilization} />
      {/* Alerts have been integrated into the Security page */}
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/cloud-providers" component={CloudProviders} />
      {/* Billing import has been integrated into the cost optimization page */}
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/subscription/success" component={SubscriptionSuccess} />
      <ProtectedRoute path="/subscription/cancel" component={SubscriptionCancel} />
      
      {/* Public routes */}
      <Route path="/" component={HomePage} /> {/* Landing page for non-authenticated users */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/documentation" component={Documentation} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <OnboardingProvider>
            <TooltipProvider>
              <MainLayout>
                <Toaster />
                <Router />
                
                {/* Onboarding components */}
                <OnboardingTour />
                <WelcomeModal />
                <HelpButton />
              </MainLayout>
            </TooltipProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
