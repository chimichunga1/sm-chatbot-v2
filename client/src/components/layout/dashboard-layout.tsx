/**
 * Dashboard Layout Component
 * Refactored to use the React compatibility layer for forward compatibility with React 19
 */
import { useState, useEffect } from "@/lib/react-compat";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  FileText,
  Brain,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Shield,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IosPwaInstaller } from "@/components/ui/ios-pwa-installer";
import { SafeArea, SafeAreaTop, SafeAreaBottom } from "@/components/ui/safe-area";
import { isPWA, isIOS } from "@/lib/utils";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // No longer needed as we're using our new utility functions and SafeArea components
  // These are declared in lib/utils.ts and will be automatically updated

  const navItems = [
    {
      name: "Quotes",
      path: "/quotes",
      icon: <FileText className="h-5 w-5" />,
      mobileIcon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Training",
      path: "/training",
      icon: <Brain className="h-5 w-5" />,
      mobileIcon: <Brain className="h-5 w-5" />,
    },
    {
      name: "Users",
      path: "/users",
      icon: <Users className="h-5 w-5" />,
      mobileIcon: <Users className="h-5 w-5" />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5" />,
      mobileIcon: <Settings className="h-5 w-5" />,
    },
  ];

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Using our utility functions for iOS and PWA detection
  const isiOSDevice = isIOS();
  const isPWAMode = isPWA();

  // Calculate header height for iOS PWA mode with notch
  const headerHeightClass = isiOSDevice && isPWAMode ? "h-ios-header" : "h-16";
  // Calculate title position for iOS PWA mode with notch
  const titlePositionClass = isiOSDevice && isPWAMode ? 
    "top-[calc(4rem+env(safe-area-inset-top))]" : "top-16";
  // Calculate content padding for iOS PWA mode
  const contentPaddingClass = isiOSDevice && isPWAMode ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : "pb-24";

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Top header bar with dynamic height for iOS safe area */}
      <header className={`fixed top-0 left-0 right-0 z-40 border-b bg-white shadow-md ${
        isiOSDevice && isPWAMode ? "pt-[env(safe-area-inset-top)]" : ""
      }`}>
        <div className={`flex items-center justify-between px-4 ${headerHeightClass}`}>
          {/* Logo and page title */}
          <div className="flex items-center gap-3">
            <Link href="/quotes" className="hover:opacity-80 active:opacity-60 transition-all">
              <h1 className="text-lg font-bold tracking-tight">PriceBetter.ai</h1>
            </Link>
            <div className="hidden md:block border-l pl-3 ml-1">
              <h2 className="text-base font-medium">{title}</h2>
            </div>
          </div>

          {/* User avatar and admin badge */}
          <div className="flex items-center gap-3">
            {/* Admin badge - only shown for admin users */}
            {user?.role === 'admin' && (
              <Link href="/admin">
                <div className="flex items-center bg-green-500 hover:bg-green-600 text-white rounded-full px-3 py-1 text-xs font-medium transition-colors shadow-sm">
                  <Shield className="h-3.5 w-3.5 mr-1" />
                  Master Admin
                </div>
              </Link>
            )}
            
            <div className="hidden md:flex md:items-center md:gap-2">
              <div className="text-sm text-right">
                <div className="font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.role}</div>
              </div>
            </div>
            <Link href="/settings">
              <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 active:opacity-60 transition-all">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user?.name || ""} />
                ) : (
                  <AvatarFallback className="bg-black text-white">{getInitials(user?.name || "User")}</AvatarFallback>
                )}
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* Dynamic spacer that matches header height */}
      <div className={headerHeightClass}></div>

      {/* Mobile title with dynamic positioning */}
      <div className={`sticky ${titlePositionClass} z-40 py-2 px-4 md:hidden bg-white border-b flex justify-between items-center`}>
        <h2 className="text-base font-semibold">{title}</h2>
        
        {/* Admin badge for mobile - only shown for admin users */}
        {user?.role === 'admin' && (
          <Link href="/admin">
            <div className="flex items-center bg-green-500 hover:bg-green-600 text-white rounded-full px-2 py-1 text-xs font-medium transition-colors shadow-sm">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </div>
          </Link>
        )}
      </div>

      {/* Main content */}
      <main className={`flex-1 ${contentPaddingClass}`}>
        {children}
      </main>

      {/* Desktop bottom menu bar - slides up from bottom */}
      <nav className={`hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t z-40 transform transition-transform duration-300 shadow-lg ${
        menuOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                location === item.path
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={closeMenu}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
          <Button
            variant="ghost"
            className="text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
            onClick={() => {
              closeMenu();
              // Enhanced logout approach - directly navigate after logout attempt
              fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
              }).finally(() => {
                // Force refresh to auth page regardless of response
                window.location.href = '/auth';
              });
            }}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Mobile bottom app bar with dynamic height for iOS safe area */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[hsl(var(--background))] border-t border-gray-200 dark:border-gray-800 z-50 shadow-md">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center w-full h-full p-1 transition-all active:bg-gray-50 dark:active:bg-gray-900 ${
                location === item.path
                  ? "text-black dark:text-white"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              <div className={`flex items-center justify-center h-6 mb-0.5 ${
                location === item.path ? "text-black dark:text-white scale-110 transition-transform" : "text-gray-500"
              }`}>
                {item.mobileIcon}
              </div>
              <span className={`text-[10px] font-medium ${
                location === item.path ? "text-black dark:text-white font-semibold" : "text-gray-500"
              }`}>
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Menu trigger button - floating at bottom right on desktop */}
      <Button 
        variant="default"
        size="icon"
        className="hidden md:flex fixed right-6 bottom-20 z-50 rounded-full shadow-lg bg-black text-white hover:bg-black/80"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* iOS PWA installer component */}
      <IosPwaInstaller />
    </div>
  );
}