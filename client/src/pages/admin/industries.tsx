import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Industry, InsertIndustry, SystemPrompt } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/layout/admin-layout";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Pencil, 
  Plus, 
  Trash2, 
  CircleAlert, 
  CheckCircle2, 
  Terminal,
  Edit,
  Check,
  BookOpen
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Create industry schema form
const industrySchema = z.object({
  // Industry fields
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

type IndustryFormValues = z.infer<typeof industrySchema>;

export default function IndustriesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState<boolean>(false);
  const [editingIndustry, setEditingIndustry] = React.useState<Industry | null>(null);
  const [deleteConfirmIndustryId, setDeleteConfirmIndustryId] = React.useState<number | null>(null);
  
  // Industry prompts states
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [activePrompt, setActivePrompt] = useState<SystemPrompt | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<SystemPrompt | null>(null);
  
  const promptForm = useForm({
    defaultValues: {
      content: "",
      industryId: null as null | number,
    }
  });

  // Fetch all industries
  const industriesQuery = useQuery<Industry[]>({
    queryKey: ["/api/admin/industries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/industries");
      if (!response.ok) throw new Error("Failed to fetch industries");
      return await response.json();
    },
  });

  // Query system prompts
  const { data: systemPrompts, isLoading: isPromptsLoading } = useQuery({
    queryKey: ["/api/admin/system-prompts"],
    select: (data: SystemPrompt[]) => {
      // Return the data organized by prompt type
      return {
        all: data,
        byType: {
          industry: data.filter(prompt => prompt.promptType === "industry"),
        }
      };
    }
  });

  // Create industry mutation
  const createIndustryMutation = useMutation({
    mutationFn: async (data: IndustryFormValues) => {
      // Create the industry
      const industryData: InsertIndustry = {
        name: data.name,
        description: data.description,
        icon: data.icon,
        isActive: data.isActive,
      };
      
      const industryResponse = await apiRequest("POST", "/api/admin/industries", industryData);
      if (!industryResponse.ok) {
        const error = await industryResponse.json();
        throw new Error(error.error || "Failed to create industry");
      }
      
      return await industryResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/industries"],
      });
      toast({
        title: "Industry created",
        description: "The industry has been created successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create industry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update industry mutation
  const updateIndustryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: IndustryFormValues;
    }) => {
      // Update the industry
      const industryData: Partial<InsertIndustry> = {
        name: data.name,
        description: data.description,
        icon: data.icon,
        isActive: data.isActive,
      };
      
      const industryResponse = await apiRequest(
        "PUT",
        `/api/admin/industries/${id}`,
        industryData
      );
      
      if (!industryResponse.ok) {
        const error = await industryResponse.json();
        throw new Error(error.error || "Failed to update industry");
      }
      
      return await industryResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/industries"],
      });
      toast({
        title: "Industry updated",
        description: "The industry has been updated successfully.",
      });
      setIsDialogOpen(false);
      setEditingIndustry(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to update industry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete industry mutation
  const deleteIndustryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/industries/${id}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete industry");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/industries"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/system-prompts"],
      });
      toast({
        title: "Industry deleted",
        description: "The industry has been deleted successfully.",
      });
      setDeleteConfirmIndustryId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete industry",
        description: error.message,
        variant: "destructive",
      });
      setDeleteConfirmIndustryId(null);
    },
  });

  // Create a new prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: (data: Omit<SystemPrompt, "id" | "createdAt" | "updatedAt">) => {
      return apiRequest("POST", "/api/admin/system-prompts", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-prompts"] });
      toast({
        title: "Success",
        description: "Industry prompt saved successfully",
      });
      // Don't reset the active prompt here - let the query re-fetch handle the updates
      setEditMode(false);
    },
    onError: (error) => {
      console.error("Error creating prompt:", error);
      toast({
        title: "Error",
        description: "Failed to save the industry prompt. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update an existing prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: ({ id, data }: { 
      id: number; 
      data: Omit<SystemPrompt, "id" | "createdAt" | "updatedAt">; 
    }) => {
      return apiRequest("PUT", `/api/admin/system-prompts/${id}`, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-prompts"] });
      toast({
        title: "Success",
        description: "Industry prompt updated successfully",
      });
      setEditMode(false);
      // Don't reset the active prompt - let the query handle that
    },
    onError: (error) => {
      console.error("Error updating prompt:", error);
      toast({
        title: "Error",
        description: "Failed to update the industry prompt. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Activate prompt mutation
  const activatePromptMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("POST", `/api/admin/system-prompts/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-prompts"] });
      toast({
        title: "Success",
        description: "Industry prompt activated successfully",
      });
    },
    onError: (error) => {
      console.error("Error activating prompt:", error);
      toast({
        title: "Error",
        description: "Failed to activate the industry prompt. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/admin/system-prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-prompts"] });
      toast({
        title: "Success",
        description: "Industry prompt deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setPromptToDelete(null);
      if (activePrompt && promptToDelete && activePrompt.id === promptToDelete.id) {
        setActivePrompt(null);
        setPromptContent("");
      }
    },
    onError: (error) => {
      console.error("Error deleting prompt:", error);
      toast({
        title: "Error",
        description: "Failed to delete the industry prompt. Please try again.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  });

  // Form setup for industries
  const form = useForm<IndustryFormValues>({
    resolver: zodResolver(industrySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      isActive: true,
    },
  });

  // Handle new industry button
  const handleNewIndustry = () => {
    setEditingIndustry(null);
    form.reset({
      name: "",
      description: "",
      icon: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  // Handle edit industry
  const handleEditIndustry = async (industry: Industry) => {
    setEditingIndustry(industry);
    
    form.reset({
      name: industry.name,
      description: industry.description || "",
      icon: industry.icon || "",
      isActive: industry.isActive,
    });
    
    setIsDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: IndustryFormValues) => {
    if (editingIndustry) {
      updateIndustryMutation.mutate({
        id: editingIndustry.id,
        data,
      });
    } else {
      createIndustryMutation.mutate(data);
    }
  };

  // Find the active prompt for a selected industry
  useEffect(() => {
    if (selectedIndustryId && systemPrompts) {
      const industryPrompts = systemPrompts.byType.industry.filter(
        p => p.industryId === selectedIndustryId
      );
      
      // If there's an active prompt, show it
      const active = industryPrompts.find(p => p.isActive);
      const anyPrompt = industryPrompts.length > 0 ? industryPrompts[0] : null;
      
      setActivePrompt(active || anyPrompt);
      setPromptContent(active?.content || anyPrompt?.content || "");
      setEditMode(false);
    } else {
      setActivePrompt(null);
      setPromptContent("");
      setEditMode(false);
    }
  }, [selectedIndustryId, systemPrompts]);

  // Handle edit prompt
  const handleEditPrompt = () => {
    setEditMode(true);
  };

  // Handle save prompt
  const handleSavePrompt = () => {
    if (!selectedIndustryId) {
      toast({
        title: "Error",
        description: "Please select an industry first",
        variant: "destructive",
      });
      return;
    }

    const selectedIndustry = industriesQuery.data?.find(i => i.id === selectedIndustryId);
    if (!selectedIndustry) return;

    const promptData = {
      name: `${selectedIndustry.name} Industry Prompt`,
      content: promptContent,
      promptType: "industry" as const,
      industryId: selectedIndustryId,
      companyId: null,
      isActive: true,
      createdBy: null, // Added to match the schema requirements
    };

    if (activePrompt) {
      updatePromptMutation.mutate({
        id: activePrompt.id,
        data: promptData,
      });
    } else {
      createPromptMutation.mutate(promptData);
    }
  };

  // Handle prompt deletion confirmation
  const handleDeletePrompt = (prompt: SystemPrompt) => {
    setPromptToDelete(prompt);
    setIsDeleteDialogOpen(true);
  };

  // Handle prompt activation
  const handleActivatePrompt = (prompt: SystemPrompt) => {
    activatePromptMutation.mutate(prompt.id);
  };

  return (
    <AdminLayout title="Industry Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage industries and their prompts for categorizing clients in your system
          </p>
          <Button onClick={handleNewIndustry}>
            <Plus className="mr-2 h-4 w-4" /> Add Industry
          </Button>
        </div>

        <Tabs defaultValue="industries" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="industries">Industries</TabsTrigger>
            <TabsTrigger value="prompts">Industry Prompts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="industries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Industries</CardTitle>
                <CardDescription>
                  These industries are used to categorize clients and provide relevant context for AI interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {industriesQuery.isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-4 rounded-md border"
                      >
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : industriesQuery.isError ? (
                  <div className="bg-destructive/10 p-4 rounded-md border border-destructive flex items-center">
                    <CircleAlert className="h-5 w-5 text-destructive mr-2" />
                    <p>Error loading industries: {String(industriesQuery.error)}</p>
                  </div>
                ) : industriesQuery.data && industriesQuery.data.length === 0 ? (
                  <div className="bg-muted p-4 rounded-md border text-center">
                    <p className="text-muted-foreground">
                      No industries have been defined yet. Click "Add Industry" to create one.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {industriesQuery.data?.map((industry) => (
                        <TableRow key={industry.id}>
                          <TableCell className="font-medium">{industry.name}</TableCell>
                          <TableCell>{industry.description || "—"}</TableCell>
                          <TableCell>
                            {industry.isActive ? (
                              <span className="inline-flex items-center bg-green-50 text-green-700 rounded-full px-2 py-1 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-gray-100 text-gray-700 rounded-full px-2 py-1 text-xs">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditIndustry(industry)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmIndustryId(industry.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Industry-Specific Prompts</CardTitle>
                <CardDescription>
                  Customize AI prompts for specific industries to provide specialized context and instructions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Industry selector column */}
                  <div className="space-y-4 md:border-r pr-4">
                    <h3 className="text-sm font-medium leading-none">Select Industry</h3>
                    {industriesQuery.isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : industriesQuery.isError ? (
                      <div className="text-sm text-destructive">
                        Error loading industries
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {industriesQuery.data?.map((industry) => (
                          <Button
                            key={industry.id}
                            variant={selectedIndustryId === industry.id ? "secondary" : "outline"}
                            className="w-full justify-start"
                            onClick={() => setSelectedIndustryId(industry.id)}
                          >
                            <div className="overflow-hidden text-ellipsis">{industry.name}</div>
                            {systemPrompts?.byType.industry.some(
                              p => p.industryId === industry.id && p.isActive
                            ) && (
                              <Badge variant="outline" className="ml-auto flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-xs">Active</span>
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prompt editing column */}
                  <div className="md:col-span-2 space-y-4">
                    {selectedIndustryId ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium leading-none">
                            {industriesQuery.data?.find(i => i.id === selectedIndustryId)?.name} Prompt
                          </h3>
                          <div className="space-x-2">
                            {!editMode ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleEditPrompt}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Prompt
                              </Button>
                            ) : (
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={handleSavePrompt}
                                disabled={createPromptMutation.isPending || updatePromptMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                {createPromptMutation.isPending || updatePromptMutation.isPending
                                  ? "Saving..."
                                  : "Save Prompt"}
                              </Button>
                            )}
                            {activePrompt && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeletePrompt(activePrompt)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>

                        {editMode ? (
                          <Textarea
                            className="min-h-[300px] font-mono text-sm"
                            value={promptContent}
                            onChange={(e) => setPromptContent(e.target.value)}
                            placeholder="Enter the specific system prompt for this industry..."
                          />
                        ) : activePrompt ? (
                          <div className="border rounded-md p-4 bg-muted/50 min-h-[300px] whitespace-pre-wrap font-mono text-sm">
                            {activePrompt.content}
                          </div>
                        ) : (
                          <div className="border border-dashed rounded-md p-4 min-h-[300px] flex items-center justify-center text-muted-foreground">
                            <div className="text-center space-y-2">
                              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/60" />
                              <p>No prompt defined for this industry yet.</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleEditPrompt}
                              >
                                Create Prompt
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-md p-4 min-h-[300px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Terminal className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                          <p>Select an industry to view or edit its prompt</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 px-6 py-3">
                <div className="text-xs text-muted-foreground">
                  <p>Industry prompts are used to provide domain-specific context when generating content for a particular industry.</p>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Industry Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIndustry ? "Edit Industry" : "Add New Industry"}
              </DialogTitle>
              <DialogDescription>
                {editingIndustry
                  ? "Update the industry details."
                  : "Add a new industry category for client classification."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Industry Details</h3>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Financial Services" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of the industry category
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description of the industry"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Icon name or URL"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional icon identifier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Active Status
                          </FormLabel>
                          <FormDescription>
                            Is this industry currently active?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createIndustryMutation.isPending ||
                      updateIndustryMutation.isPending
                    }
                  >
                    {createIndustryMutation.isPending ||
                    updateIndustryMutation.isPending
                      ? "Saving..."
                      : editingIndustry
                      ? "Update Industry"
                      : "Create Industry"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Industry Confirmation Dialog */}
        <Dialog
          open={deleteConfirmIndustryId !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirmIndustryId(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this industry? This will remove it from all client categorizations. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmIndustryId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirmIndustryId) {
                    deleteIndustryMutation.mutate(deleteConfirmIndustryId);
                  }
                }}
                disabled={deleteIndustryMutation.isPending}
              >
                {deleteIndustryMutation.isPending ? "Deleting..." : "Delete Industry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Prompt Confirmation Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsDeleteDialogOpen(false);
              setPromptToDelete(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Prompt Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this industry prompt? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (promptToDelete) {
                    deletePromptMutation.mutate(promptToDelete.id);
                  }
                }}
                disabled={deletePromptMutation.isPending}
              >
                {deletePromptMutation.isPending ? "Deleting..." : "Delete Prompt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}