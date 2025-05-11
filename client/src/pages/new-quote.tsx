import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NewQuotePage = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Create simpler React state instead of form state
  // Generate a shorter quote number starting with 001
  const generateQuoteNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    // Get a random number between 1 and 999, format with leading zeros
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `Q-${randomNum.toString().padStart(3, '0')}`;
  };
  
  const [quoteNumber, setQuoteNumber] = useState(generateQuoteNumber());
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending to server:", data);
      try {
        const response = await apiRequest("POST", "/api/quotes", data);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(`Server error: ${response.status} ${errorText}`);
        }
        return await response.json();
      } catch (err) {
        console.error("Error in mutation:", err);
        throw err;
      }
    },
    onSuccess: (newQuote) => {
      console.log("Quote created successfully:", newQuote);
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({
        title: "Quote created",
        description: "Now let's fill in the details with AI",
      });
      // Navigate to quote AI chat page instead
      navigate(`/quotes/${newQuote.id}/ai-chat`);
    },
    onError: (error) => {
      console.error("Error creating quote:", error);
      setIsSubmitting(false);
      toast({
        title: "Error creating quote",
        description: `${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission without react-hook-form
  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    
    // Combine company name and contact name into clientName field
    let clientName = "New Client";
    if (companyName && contactName) {
      clientName = `${companyName} (${contactName})`;
    } else if (companyName) {
      clientName = companyName;
    } else if (contactName) {
      clientName = contactName;
    }
    
    // Create the quote data for submission
    const quoteData = {
      quoteNumber,
      clientName,
      description,
      date: new Date(date),
      amount: 0, // Default amount
      status: "pending",
      userId: user?.id,
      companyId: (user as any)?.companyId
    };
    
    console.log('Creating quote with data:', quoteData);
    
    try {
      // Submit the data
      createQuoteMutation.mutate(quoteData);
    } catch (error) {
      // If there's an error during mutation setup, make sure to reset the submitting state
      setIsSubmitting(false);
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/quotes")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Quotes
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Step 1: Create New Quote</CardTitle>
          <CardDescription>
            Enter the quote details below to create a new quote.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateQuote} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quoteNumber">Quote Number</Label>
                <Input 
                  id="quoteNumber"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date"
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input 
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (overview of what you want)</Label>
              <Textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || createQuoteMutation.isPending}
            >
              {isSubmitting || createQuoteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Quote
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewQuotePage;