import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote } from "@shared/schema";
import { formatCurrency, formatDate, getStatusBadgeColor } from "@/lib/utils";
import { PencilLine, Trash2, Plus } from "lucide-react";
import { QuoteForm } from "@/components/quotes/quote-form";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function RecentQuotes() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const { toast } = useToast();
  
  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ['/api/quotes'],
  });
  
  // Take only the first 3 quotes
  const recentQuotes = quotes?.slice(0, 3) || [];
  
  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/quotes/${id}`);
      
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
      
      // Invalidate quotes query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
    } catch (error) {
      console.error("Error deleting quote:", error);
      
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <Card className="bg-white shadow">
        <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">Recent Quotes</CardTitle>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" /> New Quote
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="loading-spinner h-6 w-6 border-2 border-primary-600 rounded-full border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : recentQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No quotes found
                  </td>
                </tr>
              ) : (
                recentQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.quoteNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.clientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(quote.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(quote.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(quote.status)}`}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(quote)}
                        className="text-primary-600 hover:text-primary-900 mr-2"
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(quote.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{recentQuotes.length}</span> of <span className="font-medium">{quotes?.length || 0}</span> quotes
            </p>
          </div>
        </div>
      </Card>
      
      {/* Create Quote Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Quote</DialogTitle>
          </DialogHeader>
          <QuoteForm 
            onSuccess={() => {
              setIsCreateDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Quote Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Quote</DialogTitle>
          </DialogHeader>
          <QuoteForm 
            quote={selectedQuote || undefined}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
