import React, { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuoteSchema, Quote } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Extend the insertQuoteSchema with validation
const quoteFormSchema = insertQuoteSchema.extend({
  quoteNumber: z.string().min(1, "Quote number is required"),
  clientName: z.string().min(1, "Client name is required"),
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  date: z.coerce.date().refine((date) => date instanceof Date, {
    message: "Please select a valid date",
  })
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

const EditQuotePage = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const quoteId = parseInt(params.id || '0');

  // Fetch the quote data
  const { data: quote, isLoading, error } = useQuery<Quote>({
    queryKey: ['/api/quotes', quoteId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/quotes/${quoteId}`);
      return await response.json();
    },
    enabled: !isNaN(quoteId)
  });

  // Form with default values
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      quoteNumber: "",
      clientName: "",
      description: "",
      amount: 0,
      date: new Date(),
      status: "pending",
      userId: user?.id || null,
      companyId: (user as any)?.companyId || null
    }
  });

  // Update form when quote data is loaded
  useEffect(() => {
    if (quote) {
      form.reset({
        quoteNumber: quote.quoteNumber,
        clientName: quote.clientName,
        description: quote.description || "",
        amount: quote.amount || 0,
        date: new Date(quote.date),
        status: quote.status,
        userId: quote.userId,
        companyId: quote.companyId,
        xeroQuoteId: quote.xeroQuoteId,
        xeroQuoteNumber: quote.xeroQuoteNumber,
        xeroQuoteUrl: quote.xeroQuoteUrl
      });
    }
  }, [quote, form]);

  // Update quote mutation
  const updateQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormValues) => {
      const response = await apiRequest("PUT", `/api/quotes/${quoteId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quotes', quoteId] });
      toast({
        title: "Quote updated",
        description: "Your quote has been updated successfully",
      });
      navigate("/quotes");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update quote: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: QuoteFormValues) => {
    updateQuoteMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error loading quote</h2>
        <p>{error instanceof Error ? error.message : 'Quote not found'}</p>
        <Button onClick={() => navigate("/quotes")} className="mt-4">
          Back to Quotes
        </Button>
      </div>
    );
  }

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
          <CardTitle>Edit Quote #{quote.quoteNumber}</CardTitle>
          <CardDescription>
            Update the quote details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        onChange={field.onChange} 
                        onBlur={field.onBlur}
                        value={field.value || ''}
                        name={field.name}
                        ref={field.ref}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="invoiced">Invoiced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {quote.xeroQuoteId && (
                <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
                  <p>This quote is linked to Xero Quote #{quote.xeroQuoteNumber}</p>
                  {quote.xeroQuoteUrl && (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600" 
                      onClick={() => window.open(quote.xeroQuoteUrl!, '_blank')}
                    >
                      View in Xero
                    </Button>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={updateQuoteMutation.isPending}>
                {updateQuoteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditQuotePage;