import { Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { Permission } from "@/lib/permissions";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ProtectedRouteProps {
  path: string;
  permission?: Permission;
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
}

export function ProtectedRoute({ path, permission, component: Component, children }: ProtectedRouteProps) {
  return (
    <Route
      path={path}
      component={() => {
        const { user, isLoading } = useAuth();
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

        if (!user) {
          return <Redirect to="/auth" />;
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
