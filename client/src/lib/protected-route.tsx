import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type AllowedRoles = "admin" | "moderator" | "employee" | undefined;

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = ["admin", "moderator", "employee"],
  adminOnly = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: AllowedRoles[];
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If route is admin-only and user is not admin, redirect to dashboard
  if (adminOnly && user.role !== "admin") {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }
  
  // Check if the user's role is in the allowed roles for this route
  if (!allowedRoles.includes(user.role)) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
