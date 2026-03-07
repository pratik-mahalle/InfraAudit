import { Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
}

export function ProtectedRoute({ path, component: Component, children }: ProtectedRouteProps) {
  return (
    <Route
      path={path}
      component={() => {
        const { user, isLoading } = useAuth();

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

        if (Component) {
          return <Component />;
        }
        return <>{children}</>;
      }}
    />
  );
}
