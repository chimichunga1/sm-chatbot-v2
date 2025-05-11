import React from 'react';
import { Route, Redirect, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from './auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ReactNode, useEffect, useState } from '@/lib/react-compat';
import { useToast } from '@/hooks/use-toast'; // Added import for useToast

interface AdminRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function AdminRoute({ path, component: Component }: AdminRouteProps) {
  const { user, isLoading, reloadUser } = useAuth();
  const [location] = useLocation();
  const [renderReady, setRenderReady] = useState(false);
  const [authCheckCount, setAuthCheckCount] = useState(0);
  const [authenticating, setAuthenticating] = useState(true);
  const { addToast } = useToast(); // Added useToast hook

  // Ensure session is loaded correctly
  useEffect(() => {
    // Small delay to ensure we don't render during a transition
    const timer = setTimeout(() => {
      setRenderReady(true);
    }, 100);

    // If we don't have a user and we're not currently loading, perform an extra check
    if (!user && !isLoading && authCheckCount < 2) {
      setAuthenticating(true);
      console.log("Admin route - performing extra auth check");

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
    const basePath = pathSegments[1]; 
    const subPath = pathSegments[2];

    if (basePath === 'admin') {
      if (subPath === 'users') return 'Admin: Users';
      if (subPath === 'system-prompts') return 'Admin: System Prompts';
      if (subPath === 'master-prompt') return 'Admin: Master Prompt';
      if (subPath === 'industry-prompts') return 'Admin: Industry Prompts';
      if (subPath === 'settings') return 'Admin: Settings';
      return 'Admin Dashboard';
    }

    return 'Admin';
  };

  // Create a render function that handles conditional rendering
  const renderRoute = (): ReactNode => {
    // Initial loading state - show loader
    if (isLoading || authenticating || !renderReady) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Verifying admin privileges...</p>
        </div>
      );
    }

    // If not authenticated, redirect to auth page
    if (!user) {
      return <Redirect to="/auth" />;
    }

    // Check for admin or owner role
    if (user.role !== 'admin' && user.role !== 'owner') {
      return <Redirect to="/quotes" />;
    }

    // Wrap the component with the dashboard layout
    return (
      <DashboardLayout title={getPageTitle()}>
        <Component />
      </DashboardLayout>
    );
  };

  return <Route path={path}>{renderRoute()}</Route>;
}