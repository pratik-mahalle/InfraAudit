import { Route } from "wouter";

// AUTH IS TEMPORARILY DISABLED — all protected routes are accessible without login.
// To re-enable, restore the auth check using useAuth() and redirect to /auth when !user.

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
        if (Component) {
          return <Component />;
        }
        return <>{children}</>;
      }}
    />
  );
}