import { useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { saveTrainingData } from "@/lib/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, UserCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Conversation() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi there! I'm your AI pricing assistant. I'll help you create quotes and estimates for your business. Let's start training so I can learn from your examples!",
      },
      {
        id: "initial-prompt",
        role: "assistant",
        content:
          "Tell me about a project you've quoted recently. Include details like scope, materials, labor hours, and the final price.",
      },
    ],
  });
  
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Save training data when a new assistant message is added
    const lastMessage = messages[messages.length - 1];
    const secondLastMessage = messages[messages.length - 2];
    
    if (lastMessage && secondLastMessage && 
        lastMessage.role === "assistant" && 
        secondLastMessage.role === "user") {
      saveTrainingData(secondLastMessage.content, lastMessage.content)
        .catch(error => console.error("Failed to save training data:", error));
    }
  }, [messages]);
  
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }
    
    handleSubmit(e);
  };
  
  return (
    <Card className="bg-white shadow overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Train Your Pricing AI</CardTitle>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          The more you train your AI with examples, the better it will become at generating accurate quotes.
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Chat messages */}
        <div className="bg-gray-100 rounded-lg p-4 h-96 overflow-y-auto" id="chat-container">
          <div className="flex flex-col space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 bg-secondary-500 text-white rounded-full p-2">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                
                <div
                  className={`${
                    message.role === "user"
                      ? "mr-3 bg-primary-100"
                      : "ml-3 bg-white"
                  } p-3 rounded-lg shadow max-w-md`}
                >
                  <div className="text-sm text-gray-800 prose">
                    {message.content}
                  </div>
                </div>
                
                {message.role === "user" && (
                  <div className="flex-shrink-0 bg-primary-500 text-white rounded-full p-2">
                    <UserCircle className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Chat input */}
        <div className="mt-4">
          <form className="flex items-center" onSubmit={handleFormSubmit}>
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your response here..."
              className="flex-1"
            />
            <Button type="submit" className="ml-3" disabled={isLoading}>
              {isLoading ? (
                <div className="loading-spinner h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2">Send</span>
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
