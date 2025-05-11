import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Save, Bot, Mic, Send, UploadCloud } from "lucide-react";
import { format } from "date-fns";

// Define the form schema with Zod
const quoteFormSchema = z.object({
  quoteNumber: z.string().min(1, "Quote number is required"),
  title: z.string().min(1, "Quote title is required"),
  clientName: z.string().min(1, "Client name is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  status: z.string().min(1, "Status is required"),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  defaultValues?: Partial<QuoteFormValues>;
  onSubmit: (values: QuoteFormValues) => void;
  isNew?: boolean;
}

export function QuoteForm({ defaultValues, onSubmit, isNew = false }: QuoteFormProps) {
  const { user } = useAuth();
  const [aiActive, setAiActive] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string }>>([]);

  // Initialize the form with defaultValues or empty values
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: defaultValues || {
      quoteNumber: `Q-${format(new Date(), "yyyy")}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      title: "",
      clientName: "",
      description: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      status: "Draft",
    },
  });

  const handleAiPromptSubmit = async () => {
    if (!aiPrompt.trim()) return;
    
    // Add user message to conversation
    const newMessages = [
      ...aiMessages, 
      { role: "user", content: aiPrompt }
    ];
    setAiMessages(newMessages);
    
    // Clear input and show processing
    setAiPrompt("");
    setIsProcessing(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let responseContent = "";
      
      // Generate relevant response based on prompt content
      if (aiPrompt.toLowerCase().includes("kitchen")) {
        responseContent = "I can help with that kitchen renovation quote. Based on your description, I suggest:\n\nTitle: 'Modern Kitchen Renovation'\nClient: Please specify the client name\nDescription: 'Complete kitchen renovation including custom cabinets, granite countertops, premium appliance installation, and new flooring.'\nEstimated Amount: $15,500";
        
        // Auto-fill form with suggested values
        form.setValue("title", "Modern Kitchen Renovation");
        form.setValue("description", "Complete kitchen renovation including custom cabinets, granite countertops, premium appliance installation, and new flooring.");
        form.setValue("amount", 15500);
      } 
      else if (aiPrompt.toLowerCase().includes("bathroom")) {
        responseContent = "For your bathroom remodel quote, I suggest:\n\nTitle: 'Master Bathroom Remodel'\nClient: Please specify the client name\nDescription: 'Full renovation of master bathroom including new shower enclosure, soaking tub, double vanity, and premium fixtures.'\nEstimated Amount: $8,700";
        
        // Auto-fill form with suggested values
        form.setValue("title", "Master Bathroom Remodel");
        form.setValue("description", "Full renovation of master bathroom including new shower enclosure, soaking tub, double vanity, and premium fixtures.");
        form.setValue("amount", 8700);
      }
      else if (aiPrompt.toLowerCase().includes("painting") || aiPrompt.toLowerCase().includes("paint")) {
        responseContent = "For your painting project quote, I suggest:\n\nTitle: 'Interior Painting Service'\nClient: Please specify the client name\nDescription: 'Professional interior painting of living room, kitchen, and three bedrooms including premium paint, wall preparation, and two coats of finish.'\nEstimated Amount: $3,850";
        
        // Auto-fill form with suggested values
        form.setValue("title", "Interior Painting Service");
        form.setValue("description", "Professional interior painting of living room, kitchen, and three bedrooms including premium paint, wall preparation, and two coats of finish.");
        form.setValue("amount", 3850);
      }
      else {
        responseContent = "I'll help you create a quote based on your description. Please provide more details about the project so I can suggest appropriate values for the title, description, and estimated amount.";
      }
      
      // Add AI response to conversation
      setAiMessages([...newMessages, { role: "assistant", content: responseContent }]);
    } catch (error) {
      console.error("Error processing AI request:", error);
      setAiMessages([...newMessages, { role: "assistant", content: "Sorry, I encountered an error processing your request. Please try again." }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleAiAssistant = () => {
    setAiActive(!aiActive);
    if (!aiActive && aiMessages.length === 0) {
      // Add initial AI greeting when opening assistant for the first time
      setAiMessages([
        { 
          role: "assistant", 
          content: "Hi! I'm your AI quote assistant. Tell me about the project you're quoting, and I'll help fill out the details." 
        }
      ]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{isNew ? "Create New Quote" : "Edit Quote"}</CardTitle>
              <CardDescription>
                {isNew ? "Create a new quote for your client" : "Update the quote details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quoteNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quote Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5">$</span>
                              <Input
                                type="number"
                                className="pl-6"
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Draft">Draft</SelectItem>
                              <SelectItem value="Sent">Sent</SelectItem>
                              <SelectItem value="Accepted">Accepted</SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      {isNew ? "Create Quote" : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleAiAssistant}
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      {aiActive ? "Hide AI Assistant" : "AI Assistant"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* AI Assistant */}
        <div className={`${aiActive ? 'block' : 'hidden'} lg:block`}>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Quote Assistant
              </CardTitle>
              <CardDescription>
                Talk to the AI to help generate your quote details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Chat messages */}
              <div className="h-[300px] overflow-y-auto p-4 border-t border-b flex flex-col gap-4">
                {aiMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`${
                      message.role === "assistant" 
                        ? "bg-muted rounded-lg p-3 self-start max-w-[90%]" 
                        : "bg-black text-white rounded-lg p-3 self-end max-w-[90%]"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="bg-muted rounded-lg p-3 self-start max-w-[90%]">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="h-2 w-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      <div className="h-2 w-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input area */}
              <div className="p-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Ask the AI for help with your quote..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAiPromptSubmit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={!aiPrompt.trim() || isProcessing}
                    onClick={handleAiPromptSubmit}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Try: "Create a quote for a kitchen renovation project"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}