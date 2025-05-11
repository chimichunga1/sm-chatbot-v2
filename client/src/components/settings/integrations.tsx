import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SiXero, SiGoogledrive } from "react-icons/si";
import { Users } from "lucide-react";
import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  isConnected: boolean;
  connectUrl: string;
}

export function Integrations() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "xero",
      name: "Xero",
      description: "Connect your Xero account to automatically create invoices.",
      icon: <SiXero className="text-xl" />,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      isConnected: false,
      connectUrl: "/api/integrations/xero/connect",
    },
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Store and access your quotes in Google Drive.",
      icon: <SiGoogledrive className="text-xl" />,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      isConnected: true,
      connectUrl: "/api/integrations/google-drive/connect",
    },
    {
      id: "crm",
      name: "CRM Integration",
      description: "Connect with your CRM to sync customer data.",
      icon: <Users className="text-xl" />,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      isConnected: false,
      connectUrl: "/api/integrations/crm/connect",
    },
  ]);
  
  const handleConnect = (integrationId: string) => {
    // Find the integration
    const integration = integrations.find((i) => i.id === integrationId);
    
    if (!integration) return;
    
    // In a real app, redirect to the OAuth flow
    // For now, just toggle the connected status
    const updatedIntegrations = integrations.map((i) =>
      i.id === integrationId ? { ...i, isConnected: !i.isConnected } : i
    );
    
    setIntegrations(updatedIntegrations);
    
    toast({
      title: integration.isConnected ? "Disconnected" : "Connected",
      description: `${integration.name} has been ${
        integration.isConnected ? "disconnected" : "connected"
      } successfully.`,
    });
  };
  
  return (
    <Card className="bg-white shadow overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Integrations</CardTitle>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Connect with third-party services to enhance your workflow.
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {integrations.map((integration, index) => (
            <div
              key={integration.id}
              className={`flex items-center justify-between ${
                index > 0 ? "pt-6 border-t border-gray-200" : ""
              }`}
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-12 w-12 ${integration.iconBg} rounded-md flex items-center justify-center`}>
                  <div className={integration.iconColor}>{integration.icon}</div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{integration.name}</h4>
                  <p className="text-sm text-gray-500">{integration.description}</p>
                </div>
              </div>
              
              {integration.isConnected ? (
                <div className="flex items-center">
                  <span className="mr-3 text-sm text-green-600 font-medium">Connected</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(integration.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleConnect(integration.id)}
                  className={
                    integration.id === "xero"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : integration.id === "crm"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : undefined
                  }
                >
                  Connect
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
