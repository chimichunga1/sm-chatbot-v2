import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building,
  FileText,
  Terminal,
  Factory,
  Shield,
  BarChart,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import IndustryManagement from "@/components/admin/industry-management";
import HierarchicalPromptManager from "@/components/admin/hierarchical-prompt-manager";
import { useAuth } from "@/lib/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Admin stats query
  const { 
    data: stats, 
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorDetails,
    refetch: refetchStats
  } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      try {
        console.log("Fetching admin stats");
        
        // Enhanced error handling for authentication issues
        // First check if we have tokens in localStorage
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        console.log('Admin stats - Authentication check');
        console.log('Access token exists:', !!accessToken);
        console.log('Refresh token exists:', !!refreshToken);
        console.log('User state:', user ? `Loaded (${user.username})` : 'Not loaded');
        
        // Add the token directly to the request if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        };
        
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        const response = await fetch('/api/admin/stats', {
          method: 'GET',
          headers,
          credentials: 'include' // Include cookies for refresh token
        });
        
        // Handle specific status codes
        if (response.status === 401) {
          console.error("Authentication error: User not authenticated or session expired");
          // If we have tokens but got a 401, try to force a token refresh once
          if (accessToken || refreshToken) {
            try {
              console.log("Attempting emergency token refresh before admin stats load");
              const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache'
                },
                body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
                credentials: 'include'
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.accessToken) {
                  localStorage.setItem('accessToken', refreshData.accessToken);
                  if (refreshData.refreshToken) {
                    localStorage.setItem('refreshToken', refreshData.refreshToken);
                  }
                  
                  console.log("Emergency token refresh successful, retrying stats fetch");
                  // Retry the original request with the new token
                  const retryResponse = await fetch('/api/admin/stats', {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${refreshData.accessToken}`,
                      'Cache-Control': 'no-cache, no-store, must-revalidate'
                    },
                    credentials: 'include'
                  });
                  
                  if (retryResponse.ok) {
                    return await retryResponse.json();
                  }
                }
              }
            } catch (refreshError) {
              console.error("Emergency token refresh failed:", refreshError);
            }
          }
          
          throw new Error("Authentication required. Please log in again.");
        } else if (response.status === 403) {
          console.error("Authorization error: User does not have admin privileges");
          throw new Error("Admin privileges required to access this feature");
        } else if (!response.ok) {
          // Handle other errors
          let errorMessage;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || `API error: ${response.status}`;
          } catch (e) {
            // If can't parse as JSON, get text
            const errorText = await response.text();
            errorMessage = errorText || `API error: ${response.status}`;
          }
          
          console.error(`API error ${response.status}:`, errorMessage);
          throw new Error(errorMessage);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
      }
    },
    retry: 1, // Reduce retries to prevent excessive failed attempts
  });

  // Handle authentication and authorization errors
  if (statsError) {
    const errorMessage = (statsErrorDetails as Error)?.message || "Failed to load admin dashboard";
    
    // Check if it's an authentication error
    if (errorMessage.includes("Authentication required")) {
      return (
        <div className="p-8 max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              <p>You need to log in to access the admin dashboard. Your session may have expired.</p>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={() => window.location.href = "/auth"}
              >
                Go to Login Page
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    // Check if it's an authorization error
    if (errorMessage.includes("Admin privileges")) {
      return (
        <div className="p-8 max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              <p>You don't have administrator privileges required to access this page.</p>
              <p className="mt-2">Please contact an administrator if you believe you should have access.</p>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={() => window.location.href = "/"}
              >
                Return to Dashboard
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    // Generic error
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>Failed to load admin dashboard: {errorMessage}</p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => refetchStats()}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state for stats only
  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Define stat cards
  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: <Users className="h-5 w-5" />,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
    },
    {
      title: "Active Companies",
      value: stats?.activeCompanies || 0,
      icon: <Building className="h-5 w-5" />,
      iconBg: "bg-secondary-100",
      iconColor: "text-secondary-600",
    },
    {
      title: "Total Quotes",
      value: stats?.totalQuotes || 0,
      icon: <FileText className="h-5 w-5" />,
      iconBg: "bg-accent-100",
      iconColor: "text-accent-600",
    },
    {
      title: "AI Processing",
      value: stats?.aiProcessingUsage || "0 GB",
      icon: <Terminal className="h-5 w-5" />,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Welcome, {user?.name || 'Stephen'}</h2>
        <p className="text-muted-foreground mt-1">
          This is the PriceBetter.ai admin portal. From here, you can manage users, system prompts, and other administrative functions.
        </p>
      </div>

      {/* Admin Function Cards */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Admin Functions</h3>
        <p className="text-muted-foreground mb-6">
          Select one of these options to manage different aspects of your application:
        </p>
      
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-blue-50/50 hover:bg-blue-100/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="rounded-full p-3 bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold ml-4">User Management</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Manage user accounts, permissions, and company access.
              </p>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate("/admin/users")}
              >
                Access
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50/50 hover:bg-purple-100/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="rounded-full p-3 bg-purple-100">
                  <Terminal className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold ml-4">System Prompts</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure and manage AI system prompts for quote generation.
              </p>
              <Button 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate("/admin/system-prompts")}
              >
                Access
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50/50 hover:bg-green-100/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="rounded-full p-3 bg-green-100">
                  <Settings className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold ml-4">System Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure global application settings and defaults.
              </p>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => navigate("/admin/settings")}
              >
                Access
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Stats */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">System Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`rounded-full p-3 ${stat.iconBg}`}>
                    <div className={stat.iconColor}>{stat.icon}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Health Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest user actions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Activity data will be displayed here
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              System performance and status metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              System health metrics will be displayed here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}