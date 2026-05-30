import { Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { Permission } from "@/lib/permissions";
import { Loader2, Clock, LogOut } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  path: string;
  permission?: Permission;
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
}

function PendingApprovalScreen() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-md w-full mx-4 text-center space-y-6">
        <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 w-fit mx-auto">
          <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Pending Approval</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Your account{user?.email ? ` (${user.email})` : ""} has been created successfully. An administrator will review and approve your access shortly.
          </p>
        </div>
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            You'll be able to access InfraAudit once your account is approved. Please check back later.
          </p>
        </div>
        <Button variant="outline" onClick={() => signOut()} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function ProtectedRoute({ path, permission, component: Component, children }: ProtectedRouteProps) {
  return (
    <Route
      path={path}
      component={() => {
        const { user, isLoading, needsSignup, pendingApproval } = useAuth();
        const { hasPermission } = usePermission();
        const { toast } = useToast();

        const isUnauthorized = !isLoading && user && permission && !hasPermission(permission);

        useEffect(() => {
          if (isUnauthorized) {
            toast({
              title: "Access Denied",
              description: "You don't have permission to access this page.",
              variant: "destructive",
            });
          }
        }, [isUnauthorized, toast]);

        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          );
        }

        if (needsSignup) {
          return <Redirect to="/signup" />;
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        if (pendingApproval) {
          return <PendingApprovalScreen />;
        }

        if (isUnauthorized) {
          return <Redirect to="/dashboard" />;
        }

        if (Component) {
          return <Component />;
        }
        return <>{children}</>;
      }}
    />
  );
}
