import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import Vehicles from "@/pages/vehicles";
import Employees from "@/pages/employees";
import Trips from "@/pages/trips";
import Maintenance from "@/pages/maintenance";
import Bookings from "@/pages/bookings";
import Reports from "@/pages/reports";
import Users from "@/pages/users";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Dashboard - accessible to all authenticated users */}
      <ProtectedRoute path="/" component={() => 
        <Layout>
          <Dashboard />
        </Layout>
      } />
      
      {/* Vehicle management - admin and moderator can access */}
      <ProtectedRoute 
        path="/vehicles" 
        allowedRoles={["admin", "moderator"]}
        component={() => 
          <Layout>
            <Vehicles />
          </Layout>
        } 
      />
      
      {/* Employee management - admin only */}
      <ProtectedRoute 
        path="/employees" 
        adminOnly={true}
        component={() => 
          <Layout>
            <Employees />
          </Layout>
        } 
      />
      
      {/* Trip management - admin, moderator, and drivers can view */}
      <ProtectedRoute 
        path="/trips" 
        component={() => 
          <Layout>
            <Trips />
          </Layout>
        } 
      />
      
      {/* Maintenance - admin and moderator only */}
      <ProtectedRoute 
        path="/maintenance" 
        allowedRoles={["admin", "moderator"]}
        component={() => 
          <Layout>
            <Maintenance />
          </Layout>
        } 
      />
      
      {/* Bookings - all authenticated users can access */}
      <ProtectedRoute 
        path="/bookings" 
        component={() => 
          <Layout>
            <Bookings />
          </Layout>
        } 
      />
      
      {/* Reports - admin and moderator only */}
      <ProtectedRoute 
        path="/reports" 
        allowedRoles={["admin", "moderator"]}
        component={() => 
          <Layout>
            <Reports />
          </Layout>
        } 
      />
      
      {/* User management - admin only */}
      <ProtectedRoute 
        path="/users" 
        allowedRoles={["admin"]}
        component={() => 
          <Layout>
            <Users />
          </Layout>
        } 
      />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
