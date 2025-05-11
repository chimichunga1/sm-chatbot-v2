import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  Terminal,
  Factory,
  Briefcase,
  ListFilter,
  MessageSquareText,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
}

function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const [location] = useLocation();

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      {items.map((item) => (
        <Link 
          key={item.href} 
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            location === item.href ? "bg-accent text-accent-foreground" : "transparent"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminLayout({ children, title = "Admin Portal" }: AdminLayoutProps) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  
  // Force check token on mount to ensure all API requests have a valid token
  useEffect(() => {
    // Direct call to check if we have tokens in localStorage
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    console.log('AdminLayout - Authentication check');
    console.log('Access token exists:', !!accessToken);
    console.log('Refresh token exists:', !!refreshToken);
    console.log('Auth state - isAuthenticated:', isAuthenticated);
    console.log('Auth state - isLoading:', isLoading);
    console.log('Auth state - user exists:', !!user);
    
    // If there's a token in localStorage but the user isn't loaded, attempt to reload the page once
    // This handles cases where the token exists but the auth context hasn't updated yet
    if ((accessToken || refreshToken) && !isLoading && !user) {
      // This is a last-resort reload - avoids infinite loops by checking localStorage
      if (!sessionStorage.getItem('admin_reload_attempted')) {
        console.log('Attempting to reload authentication state for admin page');
        sessionStorage.setItem('admin_reload_attempted', 'true');
        
        // Force a hard reload to re-establish auth state
        window.location.reload();
      }
    }
  }, []);
  
  // Check auth status on mount and redirect if not authenticated
  useEffect(() => {
    // Don't check while auth is still loading
    if (isLoading) return;
    
    // If not authenticated, set error state
    if (!isAuthenticated) {
      setAuthError("You must be logged in to access the admin portal.");
    } else if (user && user.role !== "admin") {
      setAuthError("You don't have administrator privileges required to access this page.");
    } else {
      setAuthError(null);
    }
  }, [isAuthenticated, isLoading, user]);
  
  // Show auth error if not authenticated or not an admin
  if (authError) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            <p>{authError}</p>
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
  
  // Add a loading state to prevent blank screen while auth is checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      // Display logout toast first
      toast({
        title: "Logging out...",
        description: "Please wait while we sign you out",
        duration: 2000,
      });
      
      // Disable the button to prevent multiple clicks
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        if (button.textContent?.includes('Sign Out') || button.textContent?.includes('Log out')) {
          button.setAttribute('disabled', 'true');
        }
      });
      
      // Clear local storage items
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('lastLoginSuccess');
      
      // Add a small delay to ensure the toast is shown
      setTimeout(async () => {
        try {
          // Then call the logout function
          await logout();
          
          // Force navigation to auth page with window.location for a full page refresh
          window.location.href = "/auth";
        } catch (innerError) {
          console.error("Error during delayed logout:", innerError);
          // Force navigation as fallback
          window.location.href = '/auth?force-logout=true&error=true&t=' + new Date().getTime();
        }
      }, 300);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error logging out",
        description: "There was a problem signing out. Redirecting anyway...",
        variant: "destructive",
      });
      
      // Force navigation even on error
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1000);
    }
  };

  const sidebarItems = [
    {
      href: "/admin",
      title: "Dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      href: "/admin/users",
      title: "Users",
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/admin/master-prompt",
      title: "Master Prompt",
      icon: <Terminal className="h-4 w-4" />,
    },
    {
      href: "/admin/industry-prompts",
      title: "Industry Prompts",
      icon: <MessageSquareText className="h-4 w-4" />,
    },
    {
      href: "/admin/settings",
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-bold">PriceBetter Admin</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm mr-4">
                Logged in as <strong>{user.name || user.username}</strong>
              </span>
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2 border border-red-300 dark:border-red-800 bg-red-600 hover:bg-red-700" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Larger screens */}
        <aside className={cn(
          "z-30 border-r bg-background",
          "hidden lg:block", // Only hide on small screens
          isSidebarOpen ? "absolute inset-y-0 left-0 w-full max-w-xs" : "w-56"
        )}>
          <div className="flex h-full flex-col gap-4 px-4 py-6">
            <SidebarNav items={sidebarItems} />
          </div>
        </aside>

        {/* Mobile sidebar - slides in */}
        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
              onClick={() => setIsSidebarOpen(false)} 
            />

            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-40 w-3/4 max-w-xs border-r bg-background">
              <div className="flex h-full flex-col gap-4 px-2 py-4">
                <SidebarNav items={sidebarItems} />
              </div>
            </div>
          </div>
        ) : null}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
            {title && (
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}