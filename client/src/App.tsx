import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import SecurityMonitoring from "@/pages/SecurityMonitoring";
import CostOptimization from "@/pages/CostOptimization";
import ResourceUtilization from "@/pages/ResourceUtilization";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      {/* Protected routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/security" component={SecurityMonitoring} />
      <ProtectedRoute path="/cost" component={CostOptimization} />
      <ProtectedRoute path="/resources" component={ResourceUtilization} />
      <ProtectedRoute path="/alerts" component={Alerts} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/profile" component={Profile} />
      
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
