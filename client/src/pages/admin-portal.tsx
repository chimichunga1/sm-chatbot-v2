import React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { Users, MessageSquareText, Settings, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "@/lib/react-compat";

interface AdminCardProps {
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  buttonColor: string;
}

function AdminCard({
  title,
  description,
  link,
  icon,
  color,
  borderColor,
  buttonColor,
}: AdminCardProps) {
  return (
    <div className={`rounded-lg shadow-sm border ${borderColor} overflow-hidden`}>
      <div className={`${color} p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="p-2 rounded-full bg-white/20 dark:bg-black/20">
            {icon}
          </div>
        </div>
        <div className="mt-6">
          <Link href={link}>
            <button className={`text-white px-4 py-2 rounded-md text-sm font-medium ${buttonColor}`}>
              Access
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin portal",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  // Check if user is admin or owner
  const hasAdminAccess = user?.role === "admin" || user?.role === "owner";

  // Redirect if not an admin or owner
  if (user && !hasAdminAccess) {
    toast({
      title: "Access Denied",
      description: "You need administrator privileges to access this page",
      variant: "destructive",
    });
    navigate("/quotes");
    return null;
  }

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name || user?.username}</h2>
          <p className="text-muted-foreground text-base">
            This is the PriceBetter.ai admin portal. From here, you can manage users, system prompts, and other
            administrative functions.
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-4">Admin Functions</h2>
        <p className="text-muted-foreground mb-6">Select one of these options to manage different aspects of your application:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard 
            title="User Management"
            description="Manage user accounts, permissions, and company access."
            link="/admin/users"
            icon={<Users className="h-6 w-6" />}
            color="bg-blue-100 dark:bg-blue-950"
            borderColor="border-blue-300 dark:border-blue-800"
            buttonColor="bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
          />

          <AdminCard 
            title="System Prompts"
            description="Configure and manage AI system prompts for quote generation."
            link="/admin/system-prompts"
            icon={<MessageSquareText className="h-6 w-6" />}
            color="bg-purple-100 dark:bg-purple-950"
            borderColor="border-purple-300 dark:border-purple-800"
            buttonColor="bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
          />

          <AdminCard 
            title="System Settings"
            description="Configure global application settings and defaults."
            link="/admin/settings"
            icon={<Settings className="h-6 w-6" />}
            color="bg-emerald-100 dark:bg-emerald-950"
            borderColor="border-emerald-300 dark:border-emerald-800"
            buttonColor="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
          />

          <AdminCard 
            title="Master Prompt"
            description="Manage the master AI prompt that controls core system behavior."
            link="/admin/master-prompt"
            icon={<Shield className="h-6 w-6" />}
            color="bg-amber-100 dark:bg-amber-950"
            borderColor="border-amber-300 dark:border-amber-800"
            buttonColor="bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
          />

          <AdminCard 
            title="Industry Prompts"
            description="Manage industry-specific AI prompts and configurations."
            link="/admin/industry-prompts"
            icon={<MessageSquareText className="h-6 w-6" />}
            color="bg-pink-100 dark:bg-pink-950"
            borderColor="border-pink-300 dark:border-pink-800"
            buttonColor="bg-pink-600 hover:bg-pink-700 active:bg-pink-800"
          />
        </div>
      </div>
    </AdminLayout>
  );
}