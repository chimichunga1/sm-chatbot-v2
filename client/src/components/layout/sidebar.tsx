import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { User } from "@shared/schema";
import { 
  LayoutDashboard, 
  FileText, 
  Brain, 
  Users, 
  Settings, 
  ShieldCheck,
  LogOut,
  Terminal,
  Sparkles,
  Building2,
  Building
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from 'react';

interface SidebarProps {
  userRole: string;
  user?: User;
}

export function Sidebar({ userRole, user }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: location === "/",
    },
    {
      name: "Quotes",
      href: "/quotes",
      icon: FileText,
      active: location === "/quotes",
    },
    {
      name: "Training",
      href: "/training",
      icon: Brain,
      active: location === "/training",
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      active: location === "/users",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: location === "/settings",
    }
  ];

  // Add admin link if user is admin
  if (userRole === "admin") {
    const adminNavItems = [
      {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        active: location === "/admin",
      },
      {
        name: "Users",
        href: "/admin/users",
        icon: Users,
        active: location === "/admin/users",
      },
      {
        name: "System Prompts", 
        href: "/admin/system-prompts",
        icon: Terminal,
        active: location === "/admin/system-prompts",
      },
      {
        name: "Master Prompt",
        href: "/admin/master-prompt",
        icon: Sparkles,
        active: location === "/admin/master-prompt",
      },
      {
        name: "Industry Prompts",
        href: "/admin/industry-prompts",
        icon: Building,
        active: location === "/admin/industry-prompts",
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
        active: location === "/admin/settings",
      },
    ];
    navItems.push(...adminNavItems);
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow bg-white shadow-lg overflow-y-auto">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary">
          <h1 className="text-xl font-bold text-white">Pricewith.AI</h1>
        </div>
        <div className="flex-grow flex flex-col">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  item.active
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    item.active
                      ? "text-primary-500"
                      : "text-gray-400 group-hover:text-primary-500"
                  )}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* User profile section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src={user?.avatarUrl || ''} alt={user?.name || 'User'} />
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {user?.name || 'User'}
              </p>
              <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                {user?.email || ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={() => logout()}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


// New component for Industry Prompts page
function IndustryPromptsPage() {
  const [industryName, setIndustryName] = useState('');
  const [promptText, setPromptText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add your API call here to save the industry prompt data
    console.log("Saving industry prompt:", { industryName, promptText });
    setIndustryName('');
    setPromptText('');
  };

  return (
    <div>
      <h1>Industry Prompts</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Industry Name:
          <input type="text" value={industryName} onChange={(e) => setIndustryName(e.target.value)} />
        </label>
        <br />
        <label>
          Prompt:
          <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} />
        </label>
        <br />
        <button type="submit">Save Industry Prompt</button>
      </form>
    </div>
  );
}

export default IndustryPromptsPage;