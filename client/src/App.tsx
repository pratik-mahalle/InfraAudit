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

function Router() {
  return (
    <Switch>
      {/* Dashboard is the home page */}
      <Route path="/" component={Dashboard} />
      <Route path="/security" component={SecurityMonitoring} />
      <Route path="/cost" component={CostOptimization} />
      <Route path="/resources" component={ResourceUtilization} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/settings" component={Settings} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
