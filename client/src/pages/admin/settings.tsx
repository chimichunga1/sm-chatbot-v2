import React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <AdminLayout title="System Settings">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">System Settings</h1>
        
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
          <p className="text-muted-foreground">
            Configure global application settings and defaults.
          </p>
        </div>
        
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings Area Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              The settings configuration area is currently under development and will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}