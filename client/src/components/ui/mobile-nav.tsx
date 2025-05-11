import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn, isPWA } from '@/lib/utils';
import { SafeAreaBottom } from './safe-area';
import {
  FileText,
  MessageSquare,
  UserCog,
  Settings,
  Users,
  LogOut,
} from 'lucide-react';
import { Button } from './button';

interface MobileNavProps {
  userRole?: string;
}

export function MobileNav({ userRole = 'user' }: MobileNavProps) {
  const [location] = useLocation();

  // If not on mobile, don't render
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null;
  }

  // Handle sign out with direct navigation
  const handleSignOut = () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).finally(() => {
      // Force refresh to auth page regardless of response
      window.location.href = '/auth';
    });
  };

  return (
    <SafeAreaBottom>
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-white border-t py-2 md:hidden",
        isPWA() ? "pb-6" : ""
      )}
        style={{ /* Override any dot indicators */ }}
      >
        <div className="flex items-center justify-around">
          <NavItem
            href="/quotes"
            icon={<FileText />}
            label="Quotes"
            isActive={location === '/quotes' || location === '/'}
          />

          <NavItem
            href="/training"
            icon={<MessageSquare />}
            label="Training"
            isActive={location.startsWith('/training')}
          />

          {userRole === 'admin' && (
            <NavItem
              href="/users"
              icon={<Users />}
              label="Users"
              isActive={location.startsWith('/users')}
            />
          )}

          <NavItem
            href="/settings"
            icon={<Settings />}
            label="Settings"
            isActive={location.startsWith('/settings')}
          />

          {/* Sign out button */}
          <div className="flex flex-col items-center justify-center w-16 py-1">
            <Button
              variant="ghost" 
              className="w-full h-full p-0 bg-transparent hover:bg-transparent"
              onClick={() => {
                // Use our LogoutButton component's function for consistency
                import('@/lib/auth').then(({ logout }) => {
                  console.log("Logout initiated from mobile nav");

                  // Show a toast message if toast is available
                  try {
                    const { toast } = require('@/hooks/use-toast');
                    toast({
                      title: "Logging out...",
                      description: "Please wait while we sign you out",
                      duration: 2000,
                    });
                  } catch (e) {
                    console.log("Toast not available in this context");
                  }

                  // Execute logout with a small delay to allow any UI updates
                  setTimeout(() => {
                    logout()
                      .catch(err => console.error("Error in mobile nav logout:", err));
                  }, 300);
                });
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="w-6 h-6 mb-1 text-gray-500">
                  <LogOut />
                </div>
                <span className="text-xs text-gray-500">
                  Sign Out
                </span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </SafeAreaBottom>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center justify-center w-16 py-1">
        <div
          className={cn(
            "w-6 h-6 mb-1",
            isActive ? "text-black" : "text-gray-500"
          )}
        >
          {icon}
        </div>
        <span 
          className={cn(
            "text-xs",
            isActive ? "text-gray-800" : "text-gray-500"
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}