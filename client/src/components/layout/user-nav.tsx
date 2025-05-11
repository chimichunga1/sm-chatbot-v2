import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@shared/schema";
import { LogOut, UserCircle, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface UserNavProps {
  user?: User;
}

export function UserNav({ user }: UserNavProps) {
  const { logout } = useAuth();
  
  // Create a robust logout handler
  const handleLogout = async () => {
    try {
      console.log("Logout initiated from user nav");
      
      // Show toast before any operations
      toast({
        title: "Logging out...",
        description: "Please wait while we sign you out",
        duration: 2000,
      });
      
      // Clear tokens from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('lastLoginSuccess');
      
      // Add a small delay to ensure the toast is shown
      setTimeout(async () => {
        try {
          // Call the logout function from auth context
          await logout();
          
          // Force navigation even if the logout function doesn't redirect
          window.location.href = "/auth";
        } catch (innerError) {
          console.error("Error during delayed logout:", innerError);
          // Force navigation as fallback
          window.location.href = '/auth?force-logout=true&error=true&t=' + new Date().getTime();
        }
      }, 300);
    } catch (error) {
      console.error("Error during logout:", error);
      // Force navigation even on error
      window.location.href = "/auth";
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl || ''} alt={user?.name || 'User'} />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
