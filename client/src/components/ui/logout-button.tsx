
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function LogoutButton({ variant = "default", className = "" }: LogoutButtonProps) {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      console.log("Logout button clicked");
      toast({
        title: "Logging out...",
        description: "Please wait while we sign you out",
        duration: 2000,
      });
      
      // Disable button to prevent multiple clicks
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        if (button.textContent?.includes('Sign Out') || button.textContent?.includes('Log out')) {
          button.setAttribute('disabled', 'true');
        }
      });
      
      // Add a small delay to ensure the toast is shown
      setTimeout(async () => {
        try {
          await logout();
          // The logout function handles the redirect to the auth page
        } catch (innerError) {
          console.error("Error during delayed logout:", innerError);
          // Force navigation as fallback
          window.location.href = '/auth?force-logout=true&error=true&t=' + new Date().getTime();
        }
      }, 300);
    } catch (error) {
      console.error("Error during logout button handler:", error);
      toast({
        title: "Logout error",
        description: "There was a problem signing you out. Redirecting anyway...",
        variant: "destructive",
        duration: 3000,
      });
      
      // Force navigation even on error
      setTimeout(() => {
        window.location.href = '/auth?force-logout=true&error=true&t=' + new Date().getTime();
      }, 2000);
    }
  };

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={handleLogout}
    >
      <LogOut className="h-5 w-5 mr-2" />
      Sign Out
    </Button>
  );
}
