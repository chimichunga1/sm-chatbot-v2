import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Save, Upload, Check, AlertCircle, FilePlus, FileText } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types for system prompts
type SystemPrompt = {
  id: number;
  name: string;
  content: string;
  isActive: boolean;
  createdBy: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
};

// Define validation schema
const systemPromptSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  content: z.string().min(10, "System prompt must be at least 10 characters"),
  isActive: z.boolean().default(true),
});

export default function SystemPromptManager() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  
  // Form setup
  const form = useForm<z.infer<typeof systemPromptSchema>>({
    resolver: zodResolver(systemPromptSchema),
    defaultValues: {
      name: "",
      content: "",
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
  
  // Fetch active system prompt
  const activePromptQuery = useQuery<SystemPrompt | null>({
    queryKey: ["/api/system-prompts/active"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/system-prompts/active");
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Failed to fetch active system prompt");
        const data = await response.json();
        return data as SystemPrompt;
      } catch (error) {
        console.log("No active system prompt found:", error);
        return null;
      }
    },
  });

  // Create/Update system prompt mutation
  const savePromptMutation = useMutation({
    mutationFn: async (data: z.infer<typeof systemPromptSchema>) => {
      const response = await apiRequest("POST", editMode ? `/api/system-prompts/${activePromptQuery.data?.id}` : "/api/system-prompts", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save prompt');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: editMode ? "System prompt updated" : "System prompt created",
        description: `The system prompt has been ${editMode ? "updated" : "created"} successfully.`,
      });
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts/active"] });
    },
    onError: (error: any) => {
      toast({
        title: `Error ${editMode ? "updating" : "creating"} system prompt`,
        description: error.message || `An error occurred while ${editMode ? "updating" : "creating"} the system prompt`,
        variant: "destructive",
      });
    },
  });
  
  // Activate system prompt mutation
  const activatePromptMutation = useMutation({
    mutationFn: async (promptId: number) => {
      const response = await apiRequest("POST", `/api/system-prompts/${promptId}/activate`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate prompt');
      }
      return response.json();
    },
    onSuccess: (_, promptId) => {
      toast({
        title: "System prompt activated",
        description: "This prompt will now be used for all AI interactions.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts/active"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error activating system prompt",
        description: error.message || "An error occurred while activating the system prompt",
        variant: "destructive",
      });
    },
  });
  
  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/system-prompts/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "PDF uploaded successfully",
        description: "The system prompt has been created from the PDF content.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error uploading PDF",
        description: error.message || "An error occurred while uploading the PDF",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof systemPromptSchema>) => {
    savePromptMutation.mutate(data);
  };

  // Set form values when prompt data is loaded or edit mode changes
  useEffect(() => {
    if (activePromptQuery.data && editMode) {
      form.reset({
        name: activePromptQuery.data.name,
        content: activePromptQuery.data.content,
        isActive: activePromptQuery.data.isActive,
      });
    } else if (!editMode && !activePromptQuery.data) {
      form.reset({
        name: "",
        content: "",
        isActive: true,
      });
    }
  }, [activePromptQuery.data, editMode, form]);

  // Example system prompts
  const examplePrompts = [
    {
      name: "Quote Generation - Construction",
      content: `You are an expert in construction quoting. Your task is to generate accurate, professional quotes for construction projects.

When generating quotes:
1. Always begin with a professional greeting and brief introduction
2. Include detailed itemized costs for materials based on current market prices
3. Estimate labor costs accurately based on industry standards and complexity
4. Include a timeline for project completion
5. Suggest optional upgrades or alternatives where appropriate
6. End with terms and conditions, payment schedule, and your contact information

Keep your language clear, professional, and focused on providing accurate pricing information.`
    },
    {
      name: "Quote Generation - Consulting",
      content: `You are a specialized consultant providing quotes for professional services. Your task is to generate detailed, value-focused quotes for consulting engagements.

When creating consulting quotes:
1. Begin with a personalized introduction showing understanding of the client's specific needs
2. Clearly outline the scope of work and deliverables
3. Break down your service offerings into phases with specific costs for each
4. Explain the value and ROI the client can expect from each service
5. Include your qualifications and relevant case studies that demonstrate your expertise
6. Provide clear payment terms, timelines, and next steps

Maintain a professional, confident tone that emphasizes the value you bring rather than just listing prices.`
    }
  ];

  // Function to apply an example prompt
  const applyExamplePrompt = (example: {name: string, content: string}) => {
    form.setValue("name", example.name);
    form.setValue("content", example.content);
    setEditMode(true);
  };

  // File upload reference and handlers
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('promptFile', file);
    
    uploadFileMutation.mutate(formData);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Prompt category options
  const promptCategories = [
    { value: "core", label: "Core System Prompt" },
    { value: "industry", label: "Industry Specific" },
    { value: "client", label: "Client Specific" }
  ];
  
  // Prepare list of prompts for display
  const organizePromptsByType = () => {
    if (!promptsQuery.data) return { core: [], industry: [], client: [] };
    
    return {
      core: promptsQuery.data.filter(p => p.name.toLowerCase().includes('core')),
      industry: promptsQuery.data.filter(p => p.name.toLowerCase().includes('industry')),
      client: promptsQuery.data.filter(p => !p.name.toLowerCase().includes('core') && !p.name.toLowerCase().includes('industry'))
    };
  };
  
  const promptsByCategory = organizePromptsByType();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Prompt Management</h2>
          <p className="text-gray-500">
            Define the hierarchical prompts that drive all AI interactions in the system
          </p>
        </div>
        <div className="space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf"
          />
          <Button 
            variant="outline" 
            onClick={handleFileUploadClick}
            disabled={uploadFileMutation.isPending}
          >
            {uploadFileMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FilePlus className="mr-2 h-4 w-4" />
            )}
            Upload PDF
          </Button>
          {!editMode && (
            <Button onClick={() => setEditMode(true)}>
              Create New Prompt
            </Button>
          )}
        </div>
      </div>

      {promptsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : editMode ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editMode && activePromptQuery.data ? "Edit System Prompt" : "Create System Prompt"}</CardTitle>
                <CardDescription>
                  This prompt will be part of the hierarchical system that guides AI interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Core Quote Generation Prompt" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this system prompt. Prefix with "Core", "Industry", or "Client" to categorize.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="You are an expert in generating quotes for..."
                          className="min-h-[300px] font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Write the detailed system prompt that will guide AI generations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savePromptMutation.isPending}
                >
                  {savePromptMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  Save System Prompt
                </Button>
              </CardFooter>
            </Card>
          </form>
        
          {/* Example prompts section shown only in create mode */}
          {!activePromptQuery.data && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Example Templates</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {examplePrompts.map((example, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-base">{example.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-3">{example.content.substring(0, 150)}...</p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => applyExamplePrompt(example)}
                      >
                        Use This Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Form>
      ) : (
        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="core">Core System Prompts</TabsTrigger>
            <TabsTrigger value="industry">Industry Specific</TabsTrigger>
            <TabsTrigger value="client">Client Specific</TabsTrigger>
          </TabsList>
          
          {/* Core System Prompts Tab */}
          <TabsContent value="core" className="space-y-4 mt-4">
            {promptsByCategory.core.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No core system prompts defined yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Core prompts provide the foundation for all AI interactions.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setEditMode(true)}
                  >
                    Create Core Prompt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              promptsByCategory.core.map(prompt => (
                <Card key={prompt.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold">{prompt.name}</CardTitle>
                        <CardDescription>
                          Last updated: {new Date(prompt.updatedAt).toLocaleString()}
                          {prompt.isActive && (
                            <Badge variant="secondary" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                              Active
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            form.reset({
                              name: prompt.name,
                              content: prompt.content,
                              isActive: prompt.isActive,
                            });
                            setEditMode(true);
                          }}
                        >
                          Edit
                        </Button>
                        {!prompt.isActive && (
                          <Button 
                            size="sm"
                            onClick={() => activatePromptMutation.mutate(prompt.id)}
                            disabled={activatePromptMutation.isPending}
                          >
                            {activatePromptMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-1 h-4 w-4" />
                            )}
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm">
                      {prompt.content.length > 300 
                        ? prompt.content.substring(0, 300) + '...' 
                        : prompt.content}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Industry Specific Tab */}
          <TabsContent value="industry" className="space-y-4 mt-4">
            {promptsByCategory.industry.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No industry-specific prompts defined yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Industry prompts tailor the system to specific business domains.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setEditMode(true)}
                  >
                    Create Industry Prompt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              promptsByCategory.industry.map(prompt => (
                <Card key={prompt.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold">{prompt.name}</CardTitle>
                        <CardDescription>
                          Last updated: {new Date(prompt.updatedAt).toLocaleString()}
                          {prompt.isActive && (
                            <Badge variant="secondary" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                              Active
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            form.reset({
                              name: prompt.name,
                              content: prompt.content,
                              isActive: prompt.isActive,
                            });
                            setEditMode(true);
                          }}
                        >
                          Edit
                        </Button>
                        {!prompt.isActive && (
                          <Button 
                            size="sm"
                            onClick={() => activatePromptMutation.mutate(prompt.id)}
                            disabled={activatePromptMutation.isPending}
                          >
                            {activatePromptMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-1 h-4 w-4" />
                            )}
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm">
                      {prompt.content.length > 300 
                        ? prompt.content.substring(0, 300) + '...' 
                        : prompt.content}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Client Specific Tab */}
          <TabsContent value="client" className="space-y-4 mt-4">
            {promptsByCategory.client.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No client-specific prompts defined yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Client prompts customize the system for individual clients.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setEditMode(true)}
                  >
                    Create Client Prompt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              promptsByCategory.client.map(prompt => (
                <Card key={prompt.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold">{prompt.name}</CardTitle>
                        <CardDescription>
                          Last updated: {new Date(prompt.updatedAt).toLocaleString()}
                          {prompt.isActive && (
                            <Badge variant="secondary" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                              Active
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            form.reset({
                              name: prompt.name,
                              content: prompt.content,
                              isActive: prompt.isActive,
                            });
                            setEditMode(true);
                          }}
                        >
                          Edit
                        </Button>
                        {!prompt.isActive && (
                          <Button 
                            size="sm"
                            onClick={() => activatePromptMutation.mutate(prompt.id)}
                            disabled={activatePromptMutation.isPending}
                          >
                            {activatePromptMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-1 h-4 w-4" />
                            )}
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm">
                      {prompt.content.length > 300 
                        ? prompt.content.substring(0, 300) + '...' 
                        : prompt.content}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}