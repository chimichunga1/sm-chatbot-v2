/**
 * Quotes Page Component
 * Refactored to use the React compatibility layer for forward compatibility with React 19
 */
import { useState } from "@/lib/react-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Quote } from "@/types/quote";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, PlusCircle, FileText, MoreHorizontal, Trash2, Pencil, ExternalLink, MessageSquare } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { QuoteListMobile } from "@/components/quotes/quote-list-mobile";
import { QuoteTableRow } from "@/components/quotes/quote-table-row";
import { formatCurrency, formatDate } from "@/lib/utils";

const QuotesPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Note: We use the imported formatCurrency and formatDate functions from utils.ts

  // Fetch quotes with improved error handling
  const { data: quotes, isLoading, error } = useQuery<Quote[]>({
    queryKey: ['/api/quotes', statusFilter],
    queryFn: async () => {
      console.log("Fetching quotes with filter:", statusFilter);
      try {
        const response = await apiRequest('GET', `/api/quotes${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
        
        if (!response.ok) {
          console.error("Error response from quotes API:", response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          console.error("Error data:", errorData);
          
          // Create a more detailed error with status code
          const error = new Error(errorData.message || `Failed to fetch quotes: ${response.status} ${response.statusText}`);
          (error as any).status = response.status;
          throw error;
        }
        
        const data = await response.json();
        console.log("Fetched quotes successfully:", data?.length || 0, "quotes");
        return data;
      } catch (err) {
        console.error("Exception during quote fetch:", err);
        throw err;
      }
    },
    retry: 1 // Limit retries to reduce infinite loops
  });

  // Delete quote mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/quotes/${id}`);
    },
    onSuccess: () => {
      // Optimistically update UI by removing the deleted quote from the cache
      queryClient.setQueryData(['/api/quotes', statusFilter], (oldData: Quote[] | undefined) => {
        if (!oldData || !deleteId) return oldData;
        return oldData.filter(quote => quote.id !== deleteId);
      });
      
      // Also invalidate all quote queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      
      toast({
        title: "Quote deleted",
        description: "Quote has been deleted successfully",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete quote: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteQuoteMutation.mutate(deleteId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    // Check if it's an authentication error
    const isAuthError = error instanceof Error && 
                        ((error as any).status === 401 || (error as any).status === 403);
    
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error loading quotes</h2>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
        
        {isAuthError ? (
          <div className="mt-4 space-y-4">
            <p className="text-amber-600">Your session may have expired. Please login again.</p>
            <Button onClick={() => navigate('/auth')} className="mt-2">
              Go to Login
            </Button>
          </div>
        ) : (
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/quotes'] })} className="mt-4">
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="quotes-page">
      {/* Action bar with white background */}
      <div className="bg-background py-4 px-6 border-b mb-6">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          <div className="flex gap-4 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quotes</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button asChild className="gap-2">
            <Link href="/new-quote">
              <PlusCircle className="h-4 w-4" />
              New Quote
            </Link>
          </Button>
        </div>
      </div>

      {/* Main content with white background */}
      <div className="bg-background p-6 rounded-none min-h-[calc(100vh-12rem)]">
        <div className="max-w-screen-xl mx-auto">
          {quotes && quotes.length > 0 ? (
            <>
              {/* Desktop List */}
              <div className="hidden md:block overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]"></TableHead>
                      <TableHead>Quote #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <QuoteTableRow key={quote.id} quote={quote} />
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile List */}
              <div className="md:hidden">
                <QuoteListMobile 
                  quotes={quotes}
                  isRefetching={false}
                />
              </div>
            </>
          
          ) : (
            <div className="p-8 text-center border rounded-lg">
              <div className="flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">No quotes found</h2>
                <p className="text-muted-foreground">
                  {statusFilter !== 'all' 
                    ? `You don't have any ${statusFilter} quotes yet.` 
                    : "You haven't created any quotes yet."}
                </p>
                <Button asChild className="mt-6 gap-2">
                  <Link href="/new-quote">
                    <PlusCircle className="h-4 w-4" />
                    Create your first quote
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteQuoteMutation.isPending}>
              {deleteQuoteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotesPage;