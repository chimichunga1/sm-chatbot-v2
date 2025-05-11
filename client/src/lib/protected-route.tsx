/**
 * Protected Route Component
 * Refactored to use the React compatibility layer for forward compatibility with React 19
 */
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { ReactNode, useEffect, useState } from "@/lib/react-compat";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType<any>;
};

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading, reloadUser } = useAuth();
  const [location] = useLocation();
  const [renderReady, setRenderReady] = useState(false);
  const [authCheckCount, setAuthCheckCount] = useState(0);
  const [authenticating, setAuthenticating] = useState(true);
  
  // Ensure session is loaded correctly
  useEffect(() => {
    // Small delay to ensure we don't render during a transition
    const timer = setTimeout(() => {
      setRenderReady(true);
    }, 100);
    
    // If we don't have a user and we're not currently loading, perform an extra check
    if (!user && !isLoading && authCheckCount < 2) {
      setAuthenticating(true);
      console.log("Protected route - performing extra auth check");
      
      // Use a delay to ensure we don't cause a state update loop
      const authTimer = setTimeout(() => {
        reloadUser().then(() => {
          setAuthenticating(false);
          setAuthCheckCount(prev => prev + 1);
        });
      }, 300);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(authTimer);
      };
    } else {
      setAuthenticating(false);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, reloadUser, authCheckCount]);

  // Get page title based on the current path
  const getPageTitle = () => {
    const pathSegments = location.split('/');
    const basePath = pathSegments[1]; // Get first segment after leading slash
    
    // Generate title based on path
    switch (basePath) {
      case 'quotes':
        if (pathSegments.includes('new-quote')) return 'New Quote';
        if (pathSegments.includes('edit-quote')) return 'Edit Quote';
        if (pathSegments.includes('ai-chat')) return 'AI Chat';
        return 'Quotes';
      case 'training':
        return 'Training';
      case 'users':
        return 'Users';
      case 'settings':
        return 'Settings';
      case 'dashboard':
        return 'Dashboard';
      default:
        return 'PriceBetter.ai';
    }
  };

  // Create a render function that handles conditional rendering
  const renderRoute = (): ReactNode => {
    // Initial loading state - show loader
    if (isLoading || authenticating || !renderReady) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Verifying your session...</p>
        </div>
      );
    }

    // If not authenticated, redirect to auth page
    if (!user) {
      // Clear any stale session data before redirecting
      localStorage.removeItem('lastLoginSuccess');
      return <Redirect to="/auth" />;
    }

    // Wrap the component with the dashboard layout
    return (
      <DashboardLayout title={getPageTitle()}>
        <Component />
      </DashboardLayout>
    );
  };

  // Use the route with our render function
  return <Route path={path}>{renderRoute()}</Route>;
}