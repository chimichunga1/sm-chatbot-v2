import { AdminStats } from "@/components/admin/admin-stats";
import { UsersManagement } from "@/components/admin/users-management";
import { SystemStatus } from "@/components/admin/system-status";
import SystemPromptManager from "@/components/admin/system-prompt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Check if user is admin
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/status'],
  });
  
  // Redirect non-admin users
  useEffect(() => {
    if (authData && authData.user && authData.user.role !== "admin") {
      setLocation("/");
    }
  }, [authData, setLocation]);
  
  // If user is not admin, don't render the page
  if (!authData || !authData.user || authData.user.role !== "admin") {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
      
      {/* Admin Stats */}
      <AdminStats />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="ai-system">AI System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* System Status */}
          <SystemStatus />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6 mt-6">
          {/* Registered Users */}
          <UsersManagement />
        </TabsContent>
        
        <TabsContent value="ai-system" className="space-y-6 mt-6">
          {/* System Prompt Manager */}
          <SystemPromptManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
