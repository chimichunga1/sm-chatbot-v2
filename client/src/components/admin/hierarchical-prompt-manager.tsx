import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  AlertCircle,
  Check,
  Edit,
  Trash,
  ChevronDown,
  Power,
  Terminal,
  Factory,
  Building,
  Users,
  FileText,
  Plus,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type PromptType = "core" | "industry" | "client";

type SystemPrompt = {
  id: number;
  name: string;
  content: string;
  promptType: PromptType;
  industryId: number | null;
  isActive: boolean;
  createdBy: number;
  companyId: number | null;
  createdAt: string;
  updatedAt: string;
};

type Industry = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Company = {
  id: number;
  name: string;
  logo: string | null;
  industry: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const systemPromptSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  content: z.string().min(10, "System prompt must be at least 10 characters"),
  promptType: z.enum(["core", "industry", "client"]),
  industryId: z.number().nullable(),
  companyId: z.number().nullable(),
  isActive: z.boolean().default(true),
});

export default function HierarchicalPromptManager() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [activePrompt, setActivePrompt] = useState<SystemPrompt | null>(null);
  const [selectedTab, setSelectedTab] = useState("core");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<SystemPrompt | null>(null);
  const [companyFilter, setCompanyFilter] = useState("");
  
  // Form setup
  const form = useForm<z.infer<typeof systemPromptSchema>>({
    resolver: zodResolver(systemPromptSchema),
    defaultValues: {
      name: "",
      content: "",
      promptType: "core",
      industryId: null,
      companyId: null,
      isActive: true,
    },
  });

  // Fetch all system prompts
  const promptsQuery = useQuery<SystemPrompt[]>({
    queryKey: ["/api/system-prompts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/system-prompts");
      if (!response.ok) throw new Error("Failed to fetch system prompts");
      const data = await response.json();
      return data as SystemPrompt[];
    },
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
  
  // Fetch all companies
  const companiesQuery = useQuery<Company[]>({
    queryKey: ["/api/admin/companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/clients");
      if (!response.ok) throw new Error("Failed to fetch companies");
      return await response.json();
    },
  });

  // Create mutation for system prompts
  const createPromptMutation = useMutation({
    mutationFn: async (data: z.infer<typeof systemPromptSchema>) => {
      const response = await apiRequest("POST", "/api/system-prompts", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create system prompt");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      toast({ title: "Success", description: "System prompt created successfully" });
      setEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Update mutation for system prompts
  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof systemPromptSchema> }) => {
      const response = await apiRequest("PUT", `/api/system-prompts/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update system prompt");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      toast({ title: "Success", description: "System prompt updated successfully" });
      setEditMode(false);
      setActivePrompt(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Delete mutation for system prompts
  const deletePromptMutation = useMutation({
    mutationFn: async (id: number) => {
      // First, check if this is a Core prompt - if so, prevent deletion
      const promptToDelete = promptsQuery.data?.find(p => p.id === id);
      if (promptToDelete && promptToDelete.promptType === "core") {
        throw new Error("The Master/Core prompt cannot be deleted as it is essential for system operation");
      }
      
      const response = await apiRequest("DELETE", `/api/system-prompts/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete system prompt");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      toast({ title: "Success", description: "System prompt deleted successfully" });
      setIsDeleteDialogOpen(false);
      setPromptToDelete(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Activate mutation for system prompts
  const activatePromptMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/system-prompts/${id}`, { isActive: true });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to activate system prompt");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      toast({ title: "Success", description: "System prompt activated" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Handle form submission for create/update
  const onSubmit = (data: z.infer<typeof systemPromptSchema>) => {
    // For industry type, require an industry ID
    if (data.promptType === "industry" && !data.industryId) {
      toast({
        title: "Error",
        description: "Please select an industry for industry-specific prompts",
        variant: "destructive",
      });
      return;
    }

    // For core type, check if we're creating a new one when one already exists
    if (data.promptType === "core" && !activePrompt && promptsByType.core.length > 0) {
      toast({
        title: "Error",
        description: "Only one core prompt can exist in the system. Please edit the existing one instead.",
        variant: "destructive",
      });
      
      // Auto-redirect to edit the existing core prompt
      handleEditPrompt(promptsByType.core[0]);
      return;
    }

    // Clear industry ID for non-industry prompt types
    if (data.promptType !== "industry") {
      data.industryId = null;
    }
    
    // Auto-set the name based on prompt type
    if (data.promptType === "core") {
      data.name = "Master System Prompt";
    } else if (data.promptType === "industry" && data.industryId) {
      const industry = industriesQuery.data?.find(i => i.id === data.industryId);
      if (industry) {
        data.name = `${industry.name} Industry Prompt`;
      }
    }

    if (activePrompt) {
      updatePromptMutation.mutate({ id: activePrompt.id, data });
    } else {
      createPromptMutation.mutate(data);
    }
  };

  // Edit an existing prompt
  const handleEditPrompt = (prompt: SystemPrompt) => {
    setActivePrompt(prompt);
    form.reset({
      name: prompt.name,
      content: prompt.content,
      promptType: prompt.promptType as PromptType,
      industryId: prompt.industryId,
      companyId: prompt.companyId,
      isActive: prompt.isActive,
    });
    setEditMode(true);
  };

  // Group prompts by type for easier rendering
  const groupPromptsByType = (prompts: SystemPrompt[] = []) => {
    const core = prompts.filter(p => p.promptType === "core");
    const industry = prompts.filter(p => p.promptType === "industry");
    const client = prompts.filter(p => p.promptType === "client");
    
    return { core, industry, client };
  };

  // Get industry name by ID
  const getIndustryName = (industryId: number | null) => {
    if (!industryId) return "None";
    const industry = industriesQuery.data?.find(i => i.id === industryId);
    return industry?.name || "Unknown Industry";
  };
  
  // Get company name by ID
  const getCompanyName = (companyId: number | null) => {
    if (!companyId) return "None";
    const company = companiesQuery.data?.find(c => c.id === companyId);
    return company?.name || "Unknown Company";
  };

  // Switch between tabs
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    // Reset form when changing tabs
    if (editMode) {
      form.reset({
        name: "",
        content: "",
        promptType: value as PromptType,
        industryId: null,
        companyId: null,
        isActive: true,
      });
    }
  };

  // Handle creating a new prompt
  const handleNewPrompt = () => {
    // For core prompts, check if one already exists and prevent creating duplicates
    if (selectedTab === "core" && promptsByType.core.length > 0) {
      // If a core prompt already exists, edit the existing one instead of creating a new one
      const existingCorePrompt = promptsByType.core[0];
      handleEditPrompt(existingCorePrompt);
      toast({
        title: "Core Prompt Exists",
        description: "There can only be one core prompt. You are now editing the existing one.",
      });
      return;
    }
    
    setActivePrompt(null);
    form.reset({
      name: "",
      content: "",
      promptType: selectedTab as PromptType,
      industryId: null,
      companyId: null,
      isActive: true,
    });
    setEditMode(true);
  };

  const promptsByType = groupPromptsByType(promptsQuery.data);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Prompt Management</h2>
        {/* Creating new prompts is managed within each tab */}
      </div>
      
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="core" className="flex items-center space-x-2">
            <Terminal className="h-4 w-4" />
            <span>Core Prompt</span>
          </TabsTrigger>
          <TabsTrigger value="industry" className="flex items-center space-x-2">
            <Factory className="h-4 w-4" />
            <span>Industry Prompts</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Display editing form */}
        {editMode && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{activePrompt ? "Edit Prompt" : "Create New Prompt"}</CardTitle>
              <CardDescription>
                {selectedTab === "core" 
                  ? "Core prompts serve as the foundation for all AI interactions." 
                  : selectedTab === "industry" 
                    ? "Industry prompts tailor the AI for specific business domains." 
                    : "Client prompts customize the system for individual clients."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name field is auto-generated based on Core or Industry name */}
                  <input type="hidden" {...form.register("name")} />
                  
                  {/* Only show prompt type selection in the Core tab - Industry tab prompts are always industry type */}
                  {selectedTab === "core" && (
                    <FormField
                      control={form.control}
                      name="promptType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prompt Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={activePrompt ? activePrompt.promptType === "core" : false}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select prompt type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="core">Core Prompt</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Core prompts are used as the base for all interactions.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Hidden field to set promptType when in industry tab */}
                  {selectedTab === "industry" && (
                    <input 
                      type="hidden" 
                      {...form.register("promptType")} 
                      value="industry" 
                    />
                  )}
                  
                  {/* Industry selection field - only shown for industry type prompts */}
                  {form.watch("promptType") === "industry" && (
                    <FormField
                      control={form.control}
                      name="industryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {industriesQuery.data?.map((industry) => (
                                <SelectItem 
                                  key={industry.id} 
                                  value={industry.id.toString()}
                                >
                                  {industry.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Company selection field - only shown for client type prompts */}
                  {form.watch("promptType") === "client" && (
                    <FormField
                      control={form.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a company" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companiesQuery.data?.map((company) => (
                                <SelectItem 
                                  key={company.id} 
                                  value={company.id.toString()}
                                >
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the company this prompt will be used for
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={10} 
                            placeholder="Enter your system prompt..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This is the instruction that will be used to guide the AI.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Enable this prompt as the active prompt for its type
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
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditMode(false);
                        setActivePrompt(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPromptMutation.isPending || updatePromptMutation.isPending}>
                      {createPromptMutation.isPending || updatePromptMutation.isPending 
                        ? "Saving..." 
                        : activePrompt ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {/* Core Prompts Tab */}
        <TabsContent value="core" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Master System Prompt</CardTitle>
              <CardDescription>
                This is the primary system prompt that will override all other prompts. 
                It provides the foundation for all AI interactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {promptsByType.core.length === 0 ? (
                /* No Master Prompt exists yet - show simple creation form */
                <div>
                  <div className="text-center pb-2">
                    <Terminal className="h-10 w-10 text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground mb-6">
                      No master prompt exists yet. Create one below:
                    </p>
                  </div>
                  
                  <Textarea 
                    placeholder="Enter your master system prompt here. This prompt serves as the foundation for all AI interactions and will be used for every user in the system."
                    className="min-h-[300px] font-mono text-sm mb-4"
                    value={form.watch("content")}
                    onChange={(e) => {
                      form.setValue("content", e.target.value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                    }}
                  />
                  
                  <Button 
                    className="w-full mt-2"
                    onClick={() => {
                      const promptData = {
                        name: "Master System Prompt",
                        content: form.getValues("content"),
                        promptType: "core" as const,
                        industryId: null,
                        companyId: null,
                        isActive: true
                      };
                      
                      if (!promptData.content || promptData.content.length < 10) {
                        toast({
                          title: "Error",
                          description: "Master prompt must be at least 10 characters long",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      createPromptMutation.mutate(promptData);
                    }}
                    disabled={createPromptMutation.isPending}
                  >
                    {createPromptMutation.isPending ? "Saving..." : "Save Master Prompt"}
                  </Button>
                </div>
              ) : (
                /* Master Prompt exists - show simplified editor */
                <div>
                  {!editMode ? (
                    /* Display mode with Edit button */
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {new Date(promptsByType.core[0].updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Button 
                            onClick={() => {
                              form.setValue("content", promptsByType.core[0].content);
                              form.setValue("promptType", "core");
                              form.setValue("name", promptsByType.core[0].name);
                              form.setValue("isActive", promptsByType.core[0].isActive);
                              form.setValue("industryId", null);
                              form.setValue("companyId", null);
                              setActivePrompt(promptsByType.core[0]);
                              setEditMode(true);
                            }}
                          >
                            Edit Master Prompt
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-md whitespace-pre-wrap text-sm font-mono min-h-[200px]">
                        {promptsByType.core[0].content}
                      </div>
                    </div>
                  ) : (
                    /* Edit mode with save button */
                    <div className="space-y-4">
                      <Textarea 
                        className="min-h-[300px] font-mono text-sm mb-2"
                        value={form.watch("content")}
                        onChange={(e) => {
                          form.setValue("content", e.target.value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                        }}
                      />
                      
                      <div className="flex justify-end space-x-3">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditMode(false);
                            setActivePrompt(null);
                          }}
                        >
                          Cancel
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            if (!activePrompt) return;
                            
                            const promptData = {
                              name: activePrompt.name,
                              content: form.getValues("content"),
                              promptType: activePrompt.promptType as PromptType,
                              industryId: activePrompt.industryId,
                              companyId: activePrompt.companyId,
                              isActive: true
                            };
                            
                            if (!promptData.content || promptData.content.length < 10) {
                              toast({
                                title: "Error",
                                description: "Master prompt must be at least 10 characters long",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            updatePromptMutation.mutate({
                              id: activePrompt.id,
                              data: promptData
                            });
                          }}
                          disabled={updatePromptMutation.isPending}
                        >
                          {updatePromptMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            </Card>
        </TabsContent>
        
        {/* Industry Prompts Tab */}
        <TabsContent value="industry" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Industry Prompts</CardTitle>
                  <CardDescription>
                    These prompts are specific to different industries and act as secondary prompts that refine the master prompt.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Open the industries page in a new tab to allow adding industries
                    window.open('/admin/industries', '_blank');
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Manage Industries
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {industriesQuery.isLoading ? (
                  <div className="text-center py-4">
                    <div className="h-6 w-6 border-2 border-t-transparent border-primary animate-spin rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading industries...</p>
                  </div>
                ) : industriesQuery.data && industriesQuery.data.length > 0 ? (
                  <div>
                    <div className="mb-4">
                      <FormField
                        control={form.control}
                        name="industryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Industry</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {industriesQuery.data.map(industry => (
                                  <SelectItem key={industry.id} value={industry.id.toString()}>
                                    {industry.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the industry to view or edit its prompt
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {form.watch("industryId") ? (
                      <div>
                        {/* Show the selected industry's prompt if it exists */}
                        {(() => {
                          const selectedIndustryId = form.watch("industryId");
                          const selectedIndustry = industriesQuery.data.find(i => i.id === selectedIndustryId);
                          const industryPrompt = promptsByType.industry.find(p => p.industryId === selectedIndustryId);
                          
                          if (!selectedIndustry) return null;
                          
                          return (
                            <div className="space-y-4 border rounded-lg p-4 bg-card">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">{selectedIndustry.name} Industry Prompt</h3>
                                {industryPrompt && (
                                  <Badge className={industryPrompt.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                    {industryPrompt.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                )}
                              </div>
                              
                              {industryPrompt ? (
                                <div>
                                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-md whitespace-pre-wrap text-sm font-mono mb-4">
                                    {industryPrompt.content}
                                  </div>
                                  
                                  <div className="flex space-x-3 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setActivePrompt(industryPrompt);
                                        form.setValue("content", industryPrompt.content);
                                        setEditMode(true);
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Prompt
                                    </Button>
                                    
                                    {!industryPrompt.isActive && (
                                      <Button
                                        onClick={() => activatePromptMutation.mutate(industryPrompt.id)}
                                      >
                                        <Check className="mr-2 h-4 w-4" />
                                        Activate
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-md text-center mb-4">
                                    <p className="text-muted-foreground">
                                      No prompt exists for this industry yet. Create one below.
                                    </p>
                                  </div>
                                  
                                  <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Industry Prompt Content</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Enter industry-specific instructions for the AI..."
                                            className="min-h-[200px] font-mono text-sm"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div className="flex justify-end mt-4">
                                    <Button
                                      onClick={() => {
                                        const promptData = {
                                          name: `${selectedIndustry.name} Industry Prompt`,
                                          content: form.getValues("content"),
                                          promptType: "industry" as const,
                                          industryId: selectedIndustryId,
                                          companyId: null,
                                          isActive: true
                                        };
                                        
                                        if (!promptData.content || promptData.content.length < 10) {
                                          toast({
                                            title: "Error",
                                            description: "Industry prompt must be at least 10 characters long",
                                            variant: "destructive"
                                          });
                                          return;
                                        }
                                        
                                        createPromptMutation.mutate(promptData);
                                      }}
                                      disabled={createPromptMutation.isPending}
                                    >
                                      {createPromptMutation.isPending ? "Saving..." : "Save Industry Prompt"}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 border rounded-md">
                        <Factory className="h-10 w-10 text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground mb-2">
                          Select an industry from the dropdown to view or edit its prompt
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 border rounded-md">
                    <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-gray-500">No industries defined in the system.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Click "Manage Industries" to add industries first.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4" 
                      onClick={() => window.open('/admin/industries', '_blank')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Industries
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        

      </Tabs>
      
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete System Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this system prompt? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {promptToDelete && (
              <>
                <p><strong>Name:</strong> {promptToDelete.name}</p>
                <p><strong>Type:</strong> {promptToDelete.promptType.charAt(0).toUpperCase() + promptToDelete.promptType.slice(1)} Prompt</p>
                {promptToDelete.industryId && (
                  <p><strong>Industry:</strong> {getIndustryName(promptToDelete.industryId)}</p>
                )}
              </>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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
  );
}