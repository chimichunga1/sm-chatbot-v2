import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertIndustry, InsertSystemPrompt } from "@shared/schema";

export function CreateWebDesignIndustry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(false);
  const [status, setStatus] = useState<string>("");

  // Check if Web Design industry already exists
  const { data: industries, isLoading: isLoadingIndustries } = useQuery({
    queryKey: ["/api/admin/industries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/industries");
      if (!response.ok) throw new Error("Failed to fetch industries");
      return await response.json();
    },
  });

  // Get all companies
  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["/api/admin/companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/clients");
      if (!response.ok) throw new Error("Failed to fetch companies");
      return await response.json();
    },
  });

  // Create Industry mutation
  const createIndustryMutation = useMutation({
    mutationFn: async (industry: InsertIndustry) => {
      const response = await apiRequest("POST", "/api/admin/industries", industry);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create industry");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/industries"] });
      setStatus(prevStatus => prevStatus + "✓ Web Design industry created successfully\n");
    },
    onError: (error) => {
      setStatus(prevStatus => prevStatus + "❌ Failed to create Web Design industry: " + error.message + "\n");
      toast({
        title: "Error",
        description: "Failed to create Web Design industry: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Create system prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: async (promptData: InsertSystemPrompt) => {
      const response = await apiRequest("POST", "/api/admin/system-prompts", promptData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create system prompt");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-prompts"] });
      setStatus(prevStatus => prevStatus + "✓ Web Design industry prompt created successfully\n");
    },
    onError: (error) => {
      setStatus(prevStatus => prevStatus + "❌ Failed to create system prompt: " + error.message + "\n");
      toast({
        title: "Error",
        description: "Failed to create system prompt: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, industryId }: { id: number; industryId: number }) => {
      const response = await apiRequest("PUT", `/api/companies/${id}`, { industryId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update company");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error) => {
      setStatus(prevStatus => prevStatus + "❌ Failed to update companies: " + error.message + "\n");
      toast({
        title: "Error",
        description: "Failed to update companies: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Function to handle the entire process
  const handleCreateWebDesignIndustry = async () => {
    setStatus("Starting Web Design industry setup...\n");
    
    // Check if Web Design industry already exists
    const webDesignIndustry = industries?.find((industry: any) => 
      industry.name.toLowerCase() === "web design"
    );
    
    let industryId: number;
    
    if (webDesignIndustry) {
      industryId = webDesignIndustry.id;
      setStatus(prevStatus => prevStatus + `Found existing Web Design industry with ID: ${industryId}\n`);
    } else {
      // Create Web Design industry
      setStatus(prevStatus => prevStatus + "Creating Web Design industry...\n");
      const industryData: InsertIndustry = {
        name: "Web Design",
        description: "Web design and development services",
        icon: "globe",
        isActive: true
      };
      
      try {
        const newIndustry = await createIndustryMutation.mutateAsync(industryData);
        industryId = newIndustry.id;
      } catch (error) {
        // Error is handled in the mutation
        return;
      }
    }
    
    // Create or update the industry prompt
    const existingPrompts = await apiRequest("GET", "/api/admin/system-prompts/type/industry");
    const promptData = await existingPrompts.json();
    const existingPrompt = promptData.find((p: any) => p.industryId === industryId);
    
    if (!existingPrompt) {
      setStatus(prevStatus => prevStatus + "Creating Web Design industry prompt...\n");
      const systemPrompt: InsertSystemPrompt = {
        name: "Web Design Industry Prompt",
        content: "You are a web design specialist.",
        promptType: "industry",
        industryId: industryId,
        companyId: null,
        isActive: true,
        createdBy: null
      };
      
      try {
        await createPromptMutation.mutateAsync(systemPrompt);
      } catch (error) {
        // Error is handled in the mutation
        return;
      }
    } else {
      setStatus(prevStatus => prevStatus + `Found existing prompt for Web Design industry (ID: ${existingPrompt.id})\n`);
    }
    
    // Update all companies to use this industry
    if (companies && companies.length > 0) {
      setStatus(prevStatus => prevStatus + `Updating ${companies.length} companies to use Web Design industry...\n`);
      
      try {
        const updatePromises = companies.map((company: any) => 
          updateCompanyMutation.mutateAsync({ id: company.id, industryId })
        );
        
        await Promise.all(updatePromises);
        setStatus(prevStatus => prevStatus + `✓ Updated all ${companies.length} companies to use Web Design industry\n`);
      } catch (error) {
        // Error is handled in the mutation
        return;
      }
    } else {
      setStatus(prevStatus => prevStatus + "No companies found to update\n");
    }
    
    setStatus(prevStatus => prevStatus + "✅ All operations completed successfully!\n");
    setIsCompleted(true);
    
    toast({
      title: "Success",
      description: "Web Design industry created and associated with all companies successfully",
    });
    
    // Refresh all relevant data
    queryClient.invalidateQueries({ queryKey: ["/api/admin/industries"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/system-prompts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
  };

  if (isLoadingIndustries || isLoadingCompanies) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Web Design Industry</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Web Design Industry</CardTitle>
        <CardDescription>
          Create a Web Design industry and associate it with all client accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isCompleted ? (
          <div className="space-y-4">
            <p>
              This will create a Web Design industry with a prompt saying "you are a web design specialist" 
              and associate it with all existing client accounts.
            </p>
            
            {status && (
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[300px]">
                <pre className="text-sm font-mono whitespace-pre-wrap">{status}</pre>
              </div>
            )}
            
            <Button
              onClick={handleCreateWebDesignIndustry}
              disabled={createIndustryMutation.isPending || createPromptMutation.isPending || updateCompanyMutation.isPending}
            >
              {createIndustryMutation.isPending || createPromptMutation.isPending || updateCompanyMutation.isPending
                ? "Processing..." 
                : "Create Web Design Industry"}
            </Button>
          </div>
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Web Design industry created and associated with all client accounts successfully.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}