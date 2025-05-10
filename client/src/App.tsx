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
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import CloudProviders from "@/pages/CloudProviders";
import Documentation from "@/pages/documentation";
import AuthPage from "@/pages/auth-page";
import SubscriptionPage from "@/pages/SubscriptionPage";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import SubscriptionCancel from "@/pages/SubscriptionCancel";
import BillingImport from "@/pages/BillingImport";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { 
  OnboardingProvider, 
  OnboardingTour, 
  WelcomeModal, 
  HelpButton 
} from "@/components/onboarding";

function Router() {
  return (
    <Switch>
      {/* Protected routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/security" component={SecurityMonitoring} />
      <ProtectedRoute path="/cost" component={CostOptimization} />
      <ProtectedRoute path="/cost-prediction" component={CostPrediction} />
      <ProtectedRoute path="/resources" component={ResourceUtilization} />
      <ProtectedRoute path="/alerts" component={Alerts} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/cloud-providers" component={CloudProviders} />
      <ProtectedRoute path="/billing-import" component={BillingImport} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/subscription/success" component={SubscriptionSuccess} />
      <ProtectedRoute path="/subscription/cancel" component={SubscriptionCancel} />
      
      {/* Public routes */}
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
