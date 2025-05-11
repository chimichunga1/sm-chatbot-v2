import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Trash2, RefreshCw, Check, X, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

// Define types for our AI models
type AIModel = {
  id: number;
  name: string;
  provider: string;
  baseModel: string;
  description: string;
  isActive: boolean;
  status: string;
  fineTuningId: string | null;
  userId: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
};

type FinetuningSession = {
  id: number;
  status: string;
  datasetSize: number;
  providerJobId: string | null;
  error: string | null;
  modelId: number;
  userId: number;
  companyId: number;
  trainingHyperparams: Record<string, any> | null;
  resultMetrics: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

type TrainingData = {
  id: number;
  input: string;
  output: string;
  category: string;
  tags: string[];
  userId: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
};

// Define validation schemas
const modelSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  provider: z.string().min(1, "Provider is required"),
  baseModel: z.string().min(1, "Base model is required"),
  description: z.string().optional(),
});

const finetuneSchema = z.object({
  modelId: z.number().min(1, "Model is required"),
  trainingDataIds: z.array(z.number()).min(1, "Select at least one training example"),
});

export default function AIModelManagement() {
  const { toast } = useToast();
  const [isCreateModelOpen, setIsCreateModelOpen] = useState(false);
  const [isStartFinetuningOpen, setIsStartFinetuningOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedTrainingData, setSelectedTrainingData] = useState<number[]>([]);

  // Model form
  const modelForm = useForm<z.infer<typeof modelSchema>>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      name: "",
      provider: "openai",
      baseModel: "gpt-4o", // Default to the newest model
      description: "",
    },
  });

  // Fine-tuning form
  const finetuneForm = useForm<z.infer<typeof finetuneSchema>>({
    resolver: zodResolver(finetuneSchema),
    defaultValues: {
      modelId: 0,
      trainingDataIds: [],
    },
  });

  // Define provider status type
  type ProviderStatus = {
    openai: boolean;
    anthropic: boolean;
  };

  // Fetch AI providers status
  const providersQuery = useQuery<ProviderStatus>({
    queryKey: ["/api/ai/providers/status"],
    queryFn: async () => {
      const result = await apiRequest({ url: "/api/ai/providers/status", method: "GET" });
      return result as ProviderStatus;
    },
  });

  // Fetch AI models
  const modelsQuery = useQuery<AIModel[]>({
    queryKey: ["/api/ai/models"],
    queryFn: async () => {
      const result = await apiRequest({ url: "/api/ai/models", method: "GET" });
      return result as AIModel[];
    },
  });

  // Fetch training data
  const trainingDataQuery = useQuery<TrainingData[]>({
    queryKey: ["/api/training"],
    queryFn: async () => {
      const result = await apiRequest({ url: "/api/training", method: "GET" });
      return result as TrainingData[];
    },
  });

  // Fetch fine-tuning sessions
  const sessionsQuery = useQuery<FinetuningSession[]>({
    queryKey: ["/api/ai/finetune"],
    queryFn: async () => {
      const result = await apiRequest({ url: "/api/ai/finetune", method: "GET" });
      return result as FinetuningSession[];
    },
  });

  // Create model mutation
  const createModelMutation = useMutation({
    mutationFn: (data: z.infer<typeof modelSchema>) =>
      apiRequest({
        url: "/api/ai/models",
        method: "POST",
        data,
      }),
    onSuccess: () => {
      toast({
        title: "Model created",
        description: "Your AI model has been created successfully.",
      });
      setIsCreateModelOpen(false);
      modelForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/ai/models"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating model",
        description: error.message || "An error occurred while creating the model",
        variant: "destructive",
      });
    },
  });

  // Start fine-tuning mutation
  const startFinetuningMutation = useMutation({
    mutationFn: (data: z.infer<typeof finetuneSchema>) =>
      apiRequest({
        url: "/api/ai/finetune",
        method: "POST",
        data,
      }),
    onSuccess: () => {
      toast({
        title: "Fine-tuning started",
        description: "Your model fine-tuning process has been started successfully.",
      });
      setIsStartFinetuningOpen(false);
      finetuneForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/ai/finetune"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/models"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error starting fine-tuning",
        description: error.message || "An error occurred while starting the fine-tuning process",
        variant: "destructive",
      });
    },
  });

  // Delete model mutation
  const deleteModelMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest({
        url: `/api/ai/models/${id}`,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: "Model deleted",
        description: "The AI model has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/models"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting model",
        description: error.message || "An error occurred while deleting the model",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateModel = (data: z.infer<typeof modelSchema>) => {
    createModelMutation.mutate(data);
  };

  const handleStartFinetuning = (data: z.infer<typeof finetuneSchema>) => {
    startFinetuningMutation.mutate(data);
  };

  const handleDeleteModel = (id: number) => {
    if (window.confirm("Are you sure you want to delete this model? This action cannot be undone.")) {
      deleteModelMutation.mutate(id);
    }
  };

  const handleSelectTrainingData = (id: number) => {
    setSelectedTrainingData(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const getModelStatus = (model: AIModel, sessions: FinetuningSession[] | undefined) => {
    if (!sessions) return { status: "unknown", badge: "gray" };
    
    const modelSessions = sessions.filter(s => s.modelId === model.id);
    if (modelSessions.length === 0) return { status: "Not fine-tuned", badge: "gray" };
    
    const latestSession = modelSessions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    switch (latestSession.status) {
      case "completed":
        return { status: "Ready", badge: "green" };
      case "failed":
        return { status: "Failed", badge: "red" };
      case "pending":
      case "running":
        return { status: "Training", badge: "yellow" };
      default:
        return { status: latestSession.status, badge: "gray" };
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case "validating_files":
        return 10;
      case "queued":
        return 20;
      case "running":
        return 50;
      case "succeeded":
      case "completed":
        return 100;
      case "failed":
        return 100;
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (selectedModelId) {
      finetuneForm.setValue("modelId", selectedModelId);
    }
  }, [selectedModelId]);

  useEffect(() => {
    finetuneForm.setValue("trainingDataIds", selectedTrainingData);
  }, [selectedTrainingData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Model Management</h2>
        <Button onClick={() => setIsCreateModelOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Model
        </Button>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="training-sessions">Training Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Your AI Models</h3>
              <p className="text-sm text-gray-500">
                Manage your custom AI models for quote generation.
              </p>
            </div>

            {providersQuery.data && (
              <div className="flex gap-2">
                <Badge variant={providersQuery.data.openai ? "default" : "outline"}>
                  {providersQuery.data.openai ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      OpenAI
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      OpenAI
                    </>
                  )}
                </Badge>
                <Badge variant={providersQuery.data.anthropic ? "default" : "outline"}>
                  {providersQuery.data.anthropic ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Anthropic
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Anthropic
                    </>
                  )}
                </Badge>
              </div>
            )}
          </div>

          {modelsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : modelsQuery.data && modelsQuery.data.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modelsQuery.data.map((model) => {
                const modelStatus = getModelStatus(model, sessionsQuery.data);
                return (
                  <Card key={model.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <Badge variant={modelStatus.badge === "green" ? "default" : "outline"}>
                          {modelStatus.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {model.provider === "openai" ? "OpenAI" : "Anthropic"} / {model.baseModel}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{model.description || "No description provided."}</p>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">
                          Created: {new Date(model.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedModelId(model.id);
                          setIsStartFinetuningOpen(true);
                        }}
                        disabled={model.status === "training"}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Train
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModel(model.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-center text-gray-500 mb-4">
                  You don't have any AI models yet. Create your first model to get started.
                </p>
                <Button onClick={() => setIsCreateModelOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Model
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="training-sessions" className="space-y-4 mt-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Training Sessions</h3>
            <p className="text-sm text-gray-500">
              View the status and results of your model fine-tuning sessions.
            </p>
          </div>

          {sessionsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : sessionsQuery.data && sessionsQuery.data.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dataset Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionsQuery.data.map((session) => {
                    const model = modelsQuery.data?.find(m => m.id === session.modelId);
                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {model ? model.name : `Model #${session.modelId}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              session.status === "completed"
                                ? "default"
                                : session.status === "failed"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{session.datasetSize} examples</TableCell>
                        <TableCell>{new Date(session.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="w-[200px]">
                          <div className="flex items-center gap-2">
                            <Progress value={getProgressValue(session.status)} className="w-[60%]" />
                            {session.status === "failed" && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-center text-gray-500 mb-4">
                  You haven't started any training sessions yet.
                </p>
                <Button
                  onClick={() => {
                    if (modelsQuery.data && modelsQuery.data.length > 0) {
                      setSelectedModelId(modelsQuery.data[0].id);
                      setIsStartFinetuningOpen(true);
                    } else {
                      setIsCreateModelOpen(true);
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Training
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Model Dialog */}
      <Dialog open={isCreateModelOpen} onOpenChange={setIsCreateModelOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New AI Model</DialogTitle>
            <DialogDescription>
              Define a new AI model that you can fine-tune for quote generation.
            </DialogDescription>
          </DialogHeader>

          <Form {...modelForm}>
            <form onSubmit={modelForm.handleSubmit(handleCreateModel)} className="space-y-6">
              <FormField
                control={modelForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., My Construction Quotes Model" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for your AI model.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={modelForm.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="openai" disabled={!providersQuery.data?.openai}>
                          OpenAI {!providersQuery.data?.openai && "(API key not configured)"}
                        </SelectItem>
                        <SelectItem value="anthropic" disabled={!providersQuery.data?.anthropic}>
                          Anthropic {!providersQuery.data?.anthropic && "(API key not configured)"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The AI provider to use for this model.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={modelForm.control}
                name="baseModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a base model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelForm.watch("provider") === "openai" ? (
                          <>
                            <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Latest)</SelectItem>
                            <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                            <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The base model to fine-tune from.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={modelForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="E.g., Specialized for construction quotes with accurate material pricing"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of what this model is designed for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModelOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createModelMutation.isPending}
                >
                  {createModelMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Model
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Start Fine-tuning Dialog */}
      <Dialog open={isStartFinetuningOpen} onOpenChange={setIsStartFinetuningOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Start Model Fine-tuning</DialogTitle>
            <DialogDescription>
              Select training data to fine-tune your model for better quote generation.
            </DialogDescription>
          </DialogHeader>

          <Form {...finetuneForm}>
            <form onSubmit={finetuneForm.handleSubmit(handleStartFinetuning)} className="space-y-6">
              <FormField
                control={finetuneForm.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelsQuery.data?.map((model) => (
                          <SelectItem key={model.id} value={model.id.toString()}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The model you want to fine-tune.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Training Data</FormLabel>
                <FormDescription className="mb-4">
                  Select the training examples to use for fine-tuning your model.
                </FormDescription>

                <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                  {trainingDataQuery.isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  ) : trainingDataQuery.data && trainingDataQuery.data.length > 0 ? (
                    <div className="space-y-4">
                      {trainingDataQuery.data.map((item) => (
                        <div
                          key={item.id}
                          className={`border rounded-md p-3 cursor-pointer transition-colors ${
                            selectedTrainingData.includes(item.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleSelectTrainingData(item.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">
                              {item.input.substring(0, 60)}
                              {item.input.length > 60 ? "..." : ""}
                            </div>
                            <div>
                              <Badge variant="outline">{item.category}</Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.output.substring(0, 100)}
                            {item.output.length > 100 ? "..." : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">
                        No training data available. Add training data first.
                      </p>
                    </div>
                  )}
                </div>
                {selectedTrainingData.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedTrainingData.length} examples selected
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStartFinetuningOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    startFinetuningMutation.isPending ||
                    selectedTrainingData.length === 0 ||
                    !selectedModelId
                  }
                >
                  {startFinetuningMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Start Fine-tuning
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}