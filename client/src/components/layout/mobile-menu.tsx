import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRole: string;
  user?: User;
}

export function MobileMenu({ isOpen, setIsOpen, userRole, user }: MobileMenuProps) {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden bg-white dark:bg-[hsl(var(--background))] shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between h-16 px-4">
        <button 
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-primary-500 hover:bg-gray-100 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400">Pricewith.AI</h1>
        </div>
        <div>
          <Avatar>
            <AvatarImage src={user?.avatarUrl || ''} alt={user?.name || 'User'} />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={cn(isOpen ? "block" : "hidden")} id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/"
            className={cn(
              "block pl-3 pr-4 py-2 text-base font-medium border-l-4",
              location === "/"
                ? "bg-primary-50 text-primary-700 border-primary-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-transparent"
            )}
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link href="/quotes"
            className={cn(
              "block pl-3 pr-4 py-2 text-base font-medium border-l-4",
              location === "/quotes"
                ? "bg-primary-50 text-primary-700 border-primary-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-transparent"
            )}
            onClick={() => setIsOpen(false)}
          >
            Quotes
          </Link>
          <Link href="/training"
            className={cn(
              "block pl-3 pr-4 py-2 text-base font-medium border-l-4",
              location === "/training"
                ? "bg-primary-50 text-primary-700 border-primary-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-transparent"
            )}
            onClick={() => setIsOpen(false)}
          >
            Training
          </Link>
          <Link href="/users"
            className={cn(
              "block pl-3 pr-4 py-2 text-base font-medium border-l-4",
              location === "/users"
                ? "bg-primary-50 text-primary-700 border-primary-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-transparent"
            )}
            onClick={() => setIsOpen(false)}
          >
            Users
          </Link>
          <Link href="/settings"
            className={cn(
              "block pl-3 pr-4 py-2 text-base font-medium border-l-4",
              location === "/settings"
                ? "bg-primary-50 text-primary-700 border-primary-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-transparent"
            )}
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          {userRole === "admin" && (
            <Link href="/admin"
              className={cn(
                "block pl-3 pr-4 py-2 text-base font-medium border-l-4",
                location === "/admin"
                  ? "bg-primary-50 text-primary-700 border-primary-500"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-transparent"
              )}
              onClick={() => setIsOpen(false)}
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
