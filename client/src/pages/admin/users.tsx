import React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { UsersManagement } from "@/components/admin/users-management";

export default function AdminUsers() {
  return (
    <AdminLayout title="User Management">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
          <p className="text-muted-foreground">
            Manage user accounts, permissions, and company access. View and manage account owners.
          </p>
        </div>
        
        <div className="mt-6">
          <UsersManagement />
        </div>
      </div>
    </AdminLayout>
  );
}