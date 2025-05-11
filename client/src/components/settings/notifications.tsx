import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

export function NotificationSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "email-notifications",
      label: "Email Notifications",
      description: "Receive email notifications when quotes are created or updated.",
      checked: true,
    },
    {
      id: "weekly-summary",
      label: "Weekly Summary",
      description: "Receive a weekly summary of quote activity and AI training progress.",
      checked: true,
    },
    {
      id: "team-changes",
      label: "Team Changes",
      description: "Receive notifications when team members are added or removed.",
      checked: false,
    },
  ]);
  
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, checked } : notification
      )
    );
  };
  
  const handleSavePreferences = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, save to backend
      // await apiRequest("PUT", "/api/notifications/settings", { settings: notifications });
      
      setTimeout(() => {
        toast({
          title: "Success",
          description: "Notification preferences updated successfully",
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
      
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-white shadow overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-start">
              <div className="flex items-center h-5">
                <Checkbox
                  id={notification.id}
                  checked={notification.checked}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(notification.id, checked as boolean)
                  }
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <Label
                  htmlFor={notification.id}
                  className="font-medium text-gray-700"
                >
                  {notification.label}
                </Label>
                <p className="text-gray-500">{notification.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSavePreferences} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
