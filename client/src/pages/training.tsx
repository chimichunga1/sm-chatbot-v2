import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Brain, 
  ChevronLeft, 
  UploadCloud, 
  Send, 
  FileText,
  Info,
  X,
  MessageCircle,
  ListTodo,
  HelpCircle,
  Mic,
  FileUp,
  Upload,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

export default function TrainingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Welcome to the AI training module! ...",
      timestamp: new Date(),
    }
  ]);
  
  // Demo quote state
  const [demoQuoteData, setDemoQuoteData] = useState({
    clientName: '',
    projectTitle: '',
    projectDescription: '',
    estimatedBudget: '',
    isGenerating: false,
    generated: false,
    quote: null as any
  });
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [activeTrainingStep, setActiveTrainingStep] = useState(1);
  const [trainingData, setTrainingData] = useState({
    progress: trainingProgress * 33, // 3 steps, each worth 33%
    tasksCompleted: trainingProgress,
    totalTasks: 3
  });

  // Redirect if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Update training data when progress changes
  useEffect(() => {
    setTrainingData({
      progress: trainingProgress * 33, // 3 steps, each worth 33%
      tasksCompleted: trainingProgress,
      totalTasks: 3
    });
  }, [trainingProgress]);

  // Predefined questions for training conversation
  const [trainingQuestions] = useState<string[]>([
    "What types of services or products does your business offer?",
    "How do you typically calculate your pricing for projects?",
    "Do you offer different tiers or packages to your clients?",
    "What are the key factors that affect your pricing decisions?",
    "How do you handle pricing for rush or urgent projects?",
    "What discounts do you typically offer to clients, if any?",
    "Do you charge different rates for different types of clients?",
    "How do you estimate the time required for projects?",
    "What additional fees or charges do you include in your quotes?",
    "How do you handle revisions or changes to the original scope?"
  ]);
  
  // Track conversation progress
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationCompleted, setConversationCompleted] = useState(false);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
    setIsProcessing(true);
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      // If we're in the training step, use guided questions
      let responseContent = "";
      let nextQuestionIndex = currentQuestionIndex;
      
      if (activeTrainingStep === 2 && trainingProgress === 1) {
        // Check if we're at the end of the guided questions
        if (currentQuestionIndex >= trainingQuestions.length - 1) {
          responseContent = "Thank you for completing the first conversation! You've provided valuable information that will help train the AI to better understand your business and pricing approach.";
          setConversationCompleted(true);
          setTrainingProgress(2);
          
          // Add system message about completing step 2
          const completionMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "system",
            content: "✅ Step 2 complete: You've finished the guided conversation. Now let's move to step 3 and create a demo quote.",
            timestamp: new Date(Date.now() + 100), // Slightly later timestamp
          };
          
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: responseContent,
            timestamp: new Date(),
          }, completionMessage]);
          
          setIsProcessing(false);
          setActiveTrainingStep(3);
          return;
        } else {
          // Move to the next question
          nextQuestionIndex = currentQuestionIndex + 1;
          responseContent = "Thank you! " + trainingQuestions[nextQuestionIndex];
          setCurrentQuestionIndex(nextQuestionIndex);
        }
      } else {
        // Standard response for non-guided conversation
        responseContent = getAIResponse(userInput);
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1500);
  };
  
  // Handle voice input
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    
    // @ts-ignore - webkitSpeechRecognition is not in the TypeScript types
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(prev => prev + transcript);
    };
    
    recognition.start();
  };

  // Simple AI response generator (placeholder)
  const getAIResponse = (input: string): string => {
    const responses = [
      "That's valuable information! How do you typically handle pricing for larger projects?",
      "I've noted that down. Can you tell me more about your cost calculation methodology?",
      "Interesting approach. What factors most affect your pricing decisions?",
      "Thank you for sharing that insight. How do you compete with others in your industry?",
      "I see. What are some common challenges you face when creating quotes?",
      "I've added that to my knowledge base. What pricing strategies have worked best for you?",
      "Got it! How do you typically structure your quotes for different types of clients?",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => file.name);
      
      // Update uploaded files
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      
      // Add system message about uploaded files
      const fileMessage: Message = {
        id: Date.now().toString(),
        role: "system",
        content: `📄 Uploaded ${newFiles.length} file(s): ${newFiles.join(", ")}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fileMessage]);
      
      // Check if we've reached the required number of files (5) for step 1
      if (updatedFiles.length >= 5 && trainingProgress < 1) {
        setTrainingProgress(1);
        setActiveTrainingStep(2);
        
        // Add system message about completing step 1
        const completionMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "system",
          content: "✅ Step 1 complete: You've uploaded 5 previous quotes. Now let's move to step 2 and complete the first conversation.",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, completionMessage]);
      }
    }
  };

  // Remove uploaded file
  const removeFile = (filename: string) => {
    const updatedFiles = uploadedFiles.filter(file => file !== filename);
    setUploadedFiles(updatedFiles);
    
    // If we drop below 5 files and were already at step 1, revert progress
    if (updatedFiles.length < 5 && trainingProgress === 1) {
      setTrainingProgress(0);
    }
  };

  return (
    <DashboardLayout title="AI Training">
      <div className="space-y-6 max-w-screen-xl mx-auto px-4 md:px-6">

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[80vh]">
          {/* Sidebar */}
          <div className="lg:col-span-1 h-full">
            <Card className="bg-background border-border h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Training Guide</CardTitle>
                <CardDescription>Follow these steps to train your AI</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                {/* Training progress box */}
                <div className="flex items-center gap-3 bg-black/5 py-2 px-3 rounded-md border border-border mb-4">
                  <div className="text-right text-sm flex-1">
                    <div className="text-muted-foreground text-xs">Training progress</div>
                    <div className="font-medium text-xs">{trainingData.tasksCompleted}/{trainingData.totalTasks} tasks completed</div>
                  </div>
                  <Progress 
                    value={trainingData.progress} 
                    className="w-16 bg-white [&>div]:bg-black"
                  />
                </div>
                <div className="space-y-4">
                  <div 
                    className={`flex items-start gap-2 p-3 rounded-md cursor-pointer ${
                      activeTrainingStep === 1 
                        ? 'bg-black/5 border-2 border-black' 
                        : trainingProgress >= 1 ? 'bg-background border border-border' : 'bg-background border border-border'
                    }`}
                    onClick={() => setActiveTrainingStep(1)}
                  >
                    <div className={`rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${
                      trainingProgress >= 1 ? 'bg-black text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {trainingProgress >= 1 ? '✓' : '1'}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Upload 5 previous quotes</h3>
                      <p className="text-xs text-muted-foreground">
                        {trainingProgress >= 1 ? 'Completed' : uploadedFiles.length > 0 ? `${uploadedFiles.length}/5 uploaded` : 'Not started'}
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-start gap-2 p-3 rounded-md cursor-pointer ${
                      activeTrainingStep === 2 
                        ? 'bg-black/5 border-2 border-black' 
                        : trainingProgress >= 2 ? 'bg-background border border-border' : 'bg-background border border-border'
                    }`}
                    onClick={() => trainingProgress >= 1 ? setActiveTrainingStep(2) : null}
                  >
                    <div className={`rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${
                      trainingProgress >= 2 ? 'bg-black text-white' : trainingProgress >= 1 ? 'bg-black text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {trainingProgress >= 2 ? '✓' : '2'}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Complete first conversation</h3>
                      <p className="text-xs text-muted-foreground">
                        {trainingProgress >= 2 
                          ? 'Completed' 
                          : trainingProgress >= 1 
                            ? 'Ready to start' 
                            : 'Complete step 1 first'}
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-start gap-2 p-3 rounded-md cursor-pointer ${
                      activeTrainingStep === 3 
                        ? 'bg-black/5 border-2 border-black' 
                        : trainingProgress >= 3 ? 'bg-background border border-border' : 'bg-background border border-border'
                    }`}
                    onClick={() => trainingProgress >= 2 ? setActiveTrainingStep(3) : null}
                  >
                    <div className={`rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${
                      trainingProgress >= 3 ? 'bg-black text-white' : trainingProgress >= 2 ? 'bg-black text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {trainingProgress >= 3 ? '✓' : '3'}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Create demo quote</h3>
                      <p className="text-xs text-muted-foreground">
                        {trainingProgress >= 3 
                          ? 'Completed' 
                          : trainingProgress >= 2 
                            ? 'Ready to start' 
                            : 'Complete previous steps first'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-black hover:bg-black/80 text-white" 
                      size="sm"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Get Help
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Contact Support</DialogTitle>
                      <DialogDescription>
                        Our team is ready to help you with any questions or issues.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm">
                        Send an email to our support team for assistance with the software:
                      </p>
                      <div className="bg-muted px-4 py-3 rounded-md font-medium">
                        team@virtualinnovation.co.nz
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We'll respond to your inquiry within 1 business day.
                      </p>
                    </div>
                    <DialogFooter className="sm:justify-end">
                      <Button
                        type="button"
                        className="bg-black hover:bg-black/80 text-white"
                        onClick={() => window.location.href = "mailto:team@virtualinnovation.co.nz"}
                      >
                        Open Email
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
          
          {/* Main chat/training area */}
          <div className="lg:col-span-3 h-full">
            <Card className="bg-background border-border h-full flex flex-col">
              <CardHeader className="pb-0">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chat" className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      Chat Training
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="flex items-center gap-1">
                      <Upload className="h-4 w-4" />
                      Document Uploads
                    </TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="chat" className="m-0 pt-6 flex-1 flex flex-col">
                    {/* Chat container */}
                    <div className="border border-border rounded-md h-[400px] mb-4 overflow-y-auto p-4 bg-background">
                      {messages.map((message) => (
                        <div key={message.id} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {message.role === 'assistant' && (
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback className="bg-black text-white">AI</AvatarFallback>
                            </Avatar>
                          )}
                          
                          {message.role === 'system' && (
                            <div className="w-full bg-muted p-2 rounded text-foreground text-sm">
                              {message.content}
                            </div>
                          )}
                          
                          {message.role !== 'system' && (
                            <div 
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.role === 'user' 
                                  ? 'bg-black text-white' 
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <p>{message.content}</p>
                              <div className="text-xs mt-1 text-muted-foreground">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          )}
                          
                          {message.role === 'user' && (
                            <Avatar className="h-8 w-8 ml-2">
                              <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                              <AvatarFallback className="bg-black text-white">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      
                      {/* Auto-scroll anchor */}
                      <div ref={chatEndRef} />
                      
                      {isProcessing && (
                        <div className="flex justify-start mb-4">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="bg-black text-white">AI</AvatarFallback>
                          </Avatar>
                          <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                            <div className="flex space-x-2">
                              <div className="h-2 w-2 bg-black rounded-full animate-bounce delay-0"></div>
                              <div className="h-2 w-2 bg-black rounded-full animate-bounce delay-100"></div>
                              <div className="h-2 w-2 bg-black rounded-full animate-bounce delay-200"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Uploaded files list */}
                    {uploadedFiles.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {uploadedFiles.map((file) => (
                          <Badge key={file} variant="secondary" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {file}
                            <button onClick={() => removeFile(file)} className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-muted">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Input area for chat */}
                    {(activeTrainingStep !== 3 || trainingProgress >= 3) && (
                      <div className="flex gap-2 items-center mt-6 border-t pt-6 border-border">
                        <div className="flex gap-2 shrink-0">
                          <Button
                            className="h-10 w-10 p-0 flex items-center justify-center bg-black hover:bg-black/80 text-white"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            title="Upload files"
                          >
                            <UploadCloud className="h-4 w-4" />
                            <input
                              id="file-upload"
                              type="file"
                              multiple
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                          </Button>
                          <Button
                            className="h-10 w-10 p-0 flex items-center justify-center bg-black hover:bg-black/80 text-white"
                            onClick={handleVoiceInput}
                            title="Voice input"
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Type your message here..."
                          className="min-h-10 resize-none flex-1 h-10 py-2 px-3 border-border"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          disabled={!userInput.trim() || isProcessing} 
                          onClick={handleSendMessage}
                          style={{ backgroundColor: "black", color: "white" }}
                          className="h-10 w-10 p-0 flex items-center justify-center">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Demo quote form for step 3 */}
                    {activeTrainingStep === 3 && trainingProgress === 2 && !demoQuoteData.generated && (
                      <div className="mt-6 border-t pt-6 border-border">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-base font-medium mb-2">Create a Demo Quote</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Let's create a sample quote to test the AI's understanding of your business. 
                              Fill in the details below to generate a quote.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Client Name</label>
                              <Input 
                                value={demoQuoteData.clientName}
                                onChange={(e) => setDemoQuoteData(prev => ({ ...prev, clientName: e.target.value }))}
                                placeholder="e.g. Acme Corporation"
                                className="w-full"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Project Title</label>
                              <Input 
                                value={demoQuoteData.projectTitle}
                                onChange={(e) => setDemoQuoteData(prev => ({ ...prev, projectTitle: e.target.value }))}
                                placeholder="e.g. Website Redesign"
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Project Description</label>
                            <Textarea 
                              value={demoQuoteData.projectDescription}
                              onChange={(e) => setDemoQuoteData(prev => ({ ...prev, projectDescription: e.target.value }))}
                              placeholder="Describe the project scope, requirements, and any specific details..."
                              className="w-full min-h-[100px]"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Estimated Budget (optional)</label>
                            <Input 
                              value={demoQuoteData.estimatedBudget}
                              onChange={(e) => setDemoQuoteData(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                              placeholder="e.g. $5,000"
                              className="w-full"
                            />
                          </div>
                          
                          <Button 
                            className="w-full bg-black hover:bg-black/80 text-white mt-4"
                            disabled={!demoQuoteData.clientName || !demoQuoteData.projectTitle || !demoQuoteData.projectDescription || demoQuoteData.isGenerating}
                            onClick={() => {
                              // Generate demo quote
                              setDemoQuoteData(prev => ({ ...prev, isGenerating: true }));
                              
                              // Simulate quote generation
                              setTimeout(() => {
                                const generatedQuote = {
                                  id: "QT-" + Math.floor(Math.random() * 10000),
                                  date: new Date().toLocaleDateString(),
                                  clientName: demoQuoteData.clientName,
                                  projectTitle: demoQuoteData.projectTitle,
                                  description: demoQuoteData.projectDescription,
                                  lineItems: [
                                    { name: "Initial consultation and planning", quantity: 1, rate: 150, amount: 150 },
                                    { name: "Implementation services", quantity: 1, rate: 1200, amount: 1200 },
                                    { name: "Testing and quality assurance", quantity: 1, rate: 450, amount: 450 },
                                    { name: "Training and documentation", quantity: 1, rate: 300, amount: 300 },
                                  ],
                                  subtotal: 2100,
                                  tax: 315,
                                  total: 2415,
                                  notes: "This quote is valid for 30 days. Terms and conditions apply."
                                };
                                
                                // Update state
                                setDemoQuoteData(prev => ({ 
                                  ...prev, 
                                  isGenerating: false,
                                  generated: true,
                                  quote: generatedQuote
                                }));
                                
                                // Complete training
                                setTrainingProgress(3);
                                
                                // Add system message about completing step 3
                                const completionMessage: Message = {
                                  id: Date.now().toString(),
                                  role: "system",
                                  content: "✅ Step 3 complete: You've created a demo quote! Your AI training is now complete.",
                                  timestamp: new Date(),
                                };
                                
                                setMessages(prev => [...prev, completionMessage]);
                              }, 2000);
                            }}
                          >
                            {demoQuoteData.isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Quote...
                              </>
                            ) : (
                              <>Generate Quote</>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Generated quote display */}
                    {demoQuoteData.generated && demoQuoteData.quote && (
                      <div className="mt-6 border-t pt-6 border-border">
                        <div className="bg-background border border-border rounded-lg p-6">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-xl font-bold">QUOTE #{demoQuoteData.quote.id}</h3>
                              <p className="text-muted-foreground">Date: {demoQuoteData.quote.date}</p>
                            </div>
                            <div className="bg-black text-white px-3 py-1 rounded-md">
                              DEMO
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6 mb-8">
                            <div>
                              <h4 className="font-medium text-muted-foreground mb-1">From</h4>
                              <p className="font-medium">{user.name || "Your Company"}</p>
                              <p className="text-sm">{user.email}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-muted-foreground mb-1">To</h4>
                              <p className="font-medium">{demoQuoteData.quote.clientName}</p>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h4 className="font-medium text-xl mb-2">{demoQuoteData.quote.projectTitle}</h4>
                            <p className="text-muted-foreground">{demoQuoteData.quote.description}</p>
                          </div>
                          
                          <div className="mb-8">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 font-medium">Item</th>
                                  <th className="text-right py-2 font-medium">Quantity</th>
                                  <th className="text-right py-2 font-medium">Rate</th>
                                  <th className="text-right py-2 font-medium">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {demoQuoteData.quote.lineItems.map((item: { name: string; quantity: number; rate: number; amount: number }, index: number) => (
                                  <tr key={index} className="border-b border-border">
                                    <td className="py-3">{item.name}</td>
                                    <td className="py-3 text-right">{item.quantity}</td>
                                    <td className="py-3 text-right">${item.rate}</td>
                                    <td className="py-3 text-right">${item.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan={3} className="text-right py-3 font-medium">Subtotal</td>
                                  <td className="text-right py-3">${demoQuoteData.quote.subtotal}</td>
                                </tr>
                                <tr>
                                  <td colSpan={3} className="text-right py-3 font-medium">Tax (15%)</td>
                                  <td className="text-right py-3">${demoQuoteData.quote.tax}</td>
                                </tr>
                                <tr>
                                  <td colSpan={3} className="text-right py-3 font-bold">Total</td>
                                  <td className="text-right py-3 font-bold">${demoQuoteData.quote.total}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          
                          <div className="bg-muted p-4 rounded-md text-sm">
                            <h4 className="font-medium mb-1">Notes</h4>
                            <p>{demoQuoteData.quote.notes}</p>
                          </div>
                          
                          <div className="mt-6 flex justify-end">
                            <Button 
                              className="bg-black hover:bg-black/80 text-white"
                              onClick={() => navigate('/quotes')}
                            >
                              View All Quotes
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  
                  </TabsContent>
                  
                  <TabsContent value="tasks" className="m-0 pt-6 flex-1 flex flex-col">
                    <div className="space-y-6">
                      
                      {/* Upload area */}
                      <Card className="bg-background border-border">
                        <CardHeader>
                          <CardTitle className="text-lg">Upload Documents</CardTitle>
                          <CardDescription>
                            Upload your existing quotes, pricing sheets, and business documents to help train the AI
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                            <UploadCloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-medium mb-2">Drag and drop files here</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              or click to browse for files on your device
                            </p>
                            <Input 
                              type="file" 
                              multiple 
                              className="hidden" 
                              id="document-upload" 
                              onChange={handleFileUpload}
                            />
                            <Button 
                              className="mb-2 bg-black hover:bg-black/80 text-white" 
                              onClick={() => document.getElementById('document-upload')?.click()}
                            >
                              Select Files
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                              Supported formats: PDF, DOCX, XLSX, CSV, TXT (max 10MB per file)
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Uploaded files */}
                      <Card className="bg-background border-border">
                        <CardHeader>
                          <CardTitle className="text-lg">Uploaded Documents</CardTitle>
                          <CardDescription>
                            Files that have been processed for AI training
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {uploadedFiles.length > 0 ? (
                            <div className="space-y-2">
                              {uploadedFiles.map((file) => (
                                <div key={file} className="flex items-center justify-between border rounded-md p-3">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">{file}</p>
                                      <p className="text-xs text-muted-foreground">Uploaded just now</p>
                                    </div>
                                  </div>
                                  <Button 
                                    className="h-8 w-8 p-0 bg-black hover:bg-black/80 text-white"
                                    size="sm" 
                                    onClick={() => removeFile(file)} 
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No documents have been uploaded yet</p>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex-col space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Once you process your documents, the AI will analyze them to understand your pricing structure, 
                            quote formats, and common terms. This helps PriceWith.AI generate more accurate quotes aligned 
                            with your business practices.
                          </p>
                          <Button 
                            className="w-full bg-black hover:bg-black/80 text-white" 
                            disabled={uploadedFiles.length === 0}
                          >
                            Process Documents for Training
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}