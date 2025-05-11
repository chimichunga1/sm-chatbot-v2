import React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import HierarchicalPromptManager from "@/components/admin/hierarchical-prompt-manager";

export default function SystemPrompts() {
  return (
    <AdminLayout title="System Prompts">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">System Prompts</h1>
        
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
          <p className="text-muted-foreground">
            Configure and manage AI system prompts for quote generation. Prompts are applied in a hierarchical manner:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Core prompts provide the base system instruction for all clients</li>
            <li>Industry prompts add domain-specific context based on the client's industry</li>
            <li>Client prompts allow for customization for specific companies</li>
          </ul>
        </div>
        
        <div className="mt-6">
          <HierarchicalPromptManager />
        </div>
      </div>
    </AdminLayout>
  );
}