import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Type definition for the system prompt
type SystemPrompt = {
  id: number;
  name: string;
  content: string;
  promptType: "core" | "industry" | "client";
  industryId: number | null;
  companyId: number | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function MasterPromptPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [promptContent, setPromptContent] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch core prompts (master prompts)
  const { 
    data: corePrompts, 
    isLoading, 
    isError,
    error,
    refetch: refetchCorePrompts 
  } = useQuery<SystemPrompt[]>({
    queryKey: ["/api/admin/system-prompts/type/core"],
    queryFn: async () => {
      try {
        // Enhanced logging
        console.log("Fetching core system prompts");
        const res = await apiRequest("GET", "/api/admin/system-prompts/type/core");
        
        // Handle specific status codes
        if (res.status === 401) {
          console.error("Authentication error: User not authenticated or session expired");
          throw new Error("Authentication required. Please log in again.");
        } else if (res.status === 403) {
          console.error("Authorization error: User does not have admin privileges");
          throw new Error("Admin privileges required to access this feature");
        } else if (!res.ok) {
          // Handle other errors
          let errorMessage;
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || `API error: ${res.status}`;
          } catch (e) {
            // If can't parse as JSON, get text
            const errorText = await res.text();
            errorMessage = errorText || `API error: ${res.status}`;
          }
          console.error(`API error ${res.status}:`, errorMessage);
          throw new Error(errorMessage);
        }
        
        return res.json() as Promise<SystemPrompt[]>;
      } catch (err) {
        console.error("Error fetching core prompts:", err);
        throw err;
      }
    },
    retry: 1, // Reduce retries to prevent excessive failed attempts
    retryDelay: 1000,
  });

  // Create a new core prompt
  const createMutation = useMutation({
    mutationFn: async (promptData: any) => {
      try {
        console.log("Sending create request with data:", promptData);
        const response = await apiRequest("POST", "/api/admin/system-prompts", promptData);
        console.log("Create response status:", response.status);

        // Handle auth-specific errors
        if (response.status === 401) {
          console.error("Authentication error: User not authenticated or session expired");
          throw new Error("Authentication required. Please log in again.");
        } else if (response.status === 403) {
          console.error("Authorization error: User does not have admin privileges");
          throw new Error("Admin privileges required to access this feature");
        } else if (!response.ok) {
          // Try to parse the error response
          let errorMessage = `Failed to create master prompt: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // If can't parse as JSON, get text
            try {
              const errorText = await response.text();
              if (errorText) errorMessage = errorText;
            } catch (e2) {
              // If all else fails, use default error message
            }
          }
          
          console.error(`API error ${response.status}:`, errorMessage);
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error("Error creating master prompt:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Create success, data:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-prompts/type/core"] });
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast({
        title: "Success",
        description: "Master prompt saved successfully",
      });
    },
    onError: (err: any) => {
      console.error("Error creating master prompt:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to save master prompt",
        variant: "destructive",
      });
    }
  });

  // Update an existing core prompt
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      try {
        console.log("Sending update request for ID:", id, "with data:", data);
        const response = await apiRequest("PUT", `/api/admin/system-prompts/${id}`, data);
        console.log("Update response status:", response.status);

        // Handle auth-specific errors
        if (response.status === 401) {
          console.error("Authentication error: User not authenticated or session expired");
          throw new Error("Authentication required. Please log in again.");
        } else if (response.status === 403) {
          console.error("Authorization error: User does not have admin privileges");
          throw new Error("Admin privileges required to access this feature");
        } else if (!response.ok) {
          // Try to parse the error response
          let errorMessage = `Failed to update master prompt: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // If can't parse as JSON, get text
            try {
              const errorText = await response.text();
              if (errorText) errorMessage = errorText;
            } catch (e2) {
              // If all else fails, use default error message
            }
          }
          
          console.error(`API error ${response.status}:`, errorMessage);
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error("Error updating master prompt:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Update success, data:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-prompts/type/core"] });
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast({
        title: "Success",
        description: "Master prompt updated successfully",
      });
    },
    onError: (err: any) => {
      console.error("Error updating master prompt:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to update master prompt",
        variant: "destructive",
      });
    }
  });

  // Update prompt content when core prompts data changes
  useEffect(() => {
    if (corePrompts && corePrompts.length > 0) {
      setPromptContent(corePrompts[0].content);
    } else if (corePrompts && corePrompts.length === 0) {
      // Initialize with an empty prompt for creation
      setPromptContent("");
      // Only automatically show edit mode if there are no prompts
      setEditMode(true);
    }
  }, [corePrompts]);

  // Handle save button click
  const handleSave = () => {
    if (!promptContent.trim() || promptContent.length < 10) {
      toast({
        title: "Validation Error",
        description: "Master prompt must be at least 10 characters long",
        variant: "destructive"
      });
      return;
    }

    const promptData = {
      name: "Master System Prompt",
      content: promptContent,
      promptType: "core" as const,
      industryId: null,
      companyId: null,
      isActive: true
    };

    if (corePrompts && corePrompts.length > 0) {
      // Update existing core prompt
      updateMutation.mutate({
        id: corePrompts[0].id,
        data: promptData
      });
    } else {
      // Create new core prompt
      createMutation.mutate(promptData);
    }

    console.log("Saving prompt:", promptData);
  };

  // Handle edit button click
  const handleEdit = () => {
    setEditMode(true);
  };

  // Handle cancel button click
  const handleCancel = () => {
    setEditMode(false);
    // Reset to original content
    if (corePrompts && corePrompts.length > 0) {
      setPromptContent(corePrompts[0].content);
    } else {
      setPromptContent("");
    }
  };

  return (
    <AdminLayout title="Master System Prompt">
      <div className="space-y-6">
        <div className="space-y-2 mb-4">
          <p className="text-muted-foreground">
            The Master System Prompt is the foundation for all AI interactions in PriceBetter.ai.
            It provides the base instruction set that defines how the AI responds to user queries.
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Core prompts provide the base system instruction for all clients</li>
            <li>Industry prompts add domain-specific context based on the client's industry</li>
            <li>Client prompts allow for customization for specific companies</li>
          </ul>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Master System Prompt</span>
              {saveSuccess && (
                <span className="flex items-center text-sm text-green-600 font-normal">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> 
                  Successfully saved
                </span>
              )}
            </CardTitle>
            <CardDescription>
              This is the primary system prompt that provides the foundation for all AI interactions in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 border-2 border-t-transparent border-primary animate-spin rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading master prompt...</p>
              </div>
            ) : isError ? (
              <div className="space-y-4">
                {/* Display appropriate alert based on error type */}
                {(error as any)?.message?.includes("Authentication required") ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Authentication Required</AlertTitle>
                    <AlertDescription>
                      <p>You need to log in to access this feature. Your session may have expired.</p>
                      <Button
                        variant="secondary"
                        className="mt-3"
                        onClick={() => window.location.href = "/login"}
                      >
                        Go to Login Page
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (error as any)?.message?.includes("Admin privileges") ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                      <p>You don't have administrator privileges required to access this page.</p>
                      <p className="mt-2">Please contact an administrator if you believe you should have access.</p>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load master prompt: {(error as any)?.message || "Unknown error"}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Only show the creation form for errors that aren't auth-related */}
                {!(error as any)?.message?.includes("Authentication required") && 
                 !(error as any)?.message?.includes("Admin privileges") && (
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      You can create a new master prompt below:
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Enter your prompt content in the text area below. For example: "You are a specialist pricing expert"
                    </p>
                    <Textarea 
                      className="min-h-[300px] font-mono text-sm"
                      value={promptContent}
                      onChange={(e) => setPromptContent(e.target.value)}
                      placeholder="Enter the master system prompt here. This is the foundation for all AI interactions."
                    />
                    <div className="flex justify-end mt-4">
                      <Button 
                        onClick={handleSave}
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? "Saving..." : "Save Master Prompt"}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Add a refresh button for non-auth errors */}
                {!(error as any)?.message?.includes("Authentication required") && 
                 !(error as any)?.message?.includes("Admin privileges") && (
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => refetchCorePrompts()}
                      className="text-xs"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {editMode ? (
                  <div className="space-y-4">
                    <Textarea 
                      className="min-h-[300px] font-mono text-sm"
                      value={promptContent}
                      onChange={(e) => setPromptContent(e.target.value)}
                      placeholder="Enter the master system prompt here. This is the foundation for all AI interactions."
                    />
                    <div className="flex justify-end space-x-3">
                      {corePrompts && corePrompts.length > 0 && (
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                      )}
                      <Button 
                        onClick={handleSave}
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {createMutation.isPending || updateMutation.isPending 
                          ? "Saving..." 
                          : "Save Master Prompt"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {corePrompts && corePrompts.length > 0 ? (
                      <>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            Last updated: {new Date(corePrompts[0].updatedAt).toLocaleString()}
                          </p>
                          <Button onClick={handleEdit}>
                            Edit Master Prompt
                          </Button>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-md whitespace-pre-wrap text-sm font-mono min-h-[200px]">
                          {corePrompts[0].content}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">No master prompt found. Create one now.</p>
                        <Button onClick={() => setEditMode(true)}>
                          Create Master Prompt
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Help section */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Prompt Hierarchy</AlertTitle>
          <AlertDescription>
            <p>Prompts are applied in a hierarchical manner:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Core Prompt is read by AI before any action, providing the foundation for all AI interactions</li>
              <li>Industry Prompts are added to the Core Prompt when the AI is communicating with a client in that industry</li>
              <li>Client-specific prompts are automatically generated from loaded files and client conversations</li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
}