import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuoteForm } from "@/components/quotes/quote-form";
import { Search, ArrowUpDown, Plus, PencilLine, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, getStatusBadgeColor } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function QuotesTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all-time");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [sortField, setSortField] = useState<keyof Quote>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  
  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ['/api/quotes'],
  });
  
  // Handle sorting
  const handleSort = (field: keyof Quote) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Filter and sort quotes
  const filteredQuotes = quotes
    ? quotes
        .filter((quote) => {
          // Apply search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              quote.quoteNumber.toLowerCase().includes(query) ||
              quote.clientName.toLowerCase().includes(query) ||
              (quote.description && quote.description.toLowerCase().includes(query))
            );
          }
          return true;
        })
        .filter((quote) => {
          // Apply status filter
          if (statusFilter) {
            return quote.status === statusFilter;
          }
          return true;
        })
        .filter((quote) => {
          // Apply date filter
          if (dateFilter === "all-time") return true;
          
          const quoteDate = new Date(quote.date);
          const now = new Date();
          
          switch (dateFilter) {
            case "last-7-days":
              const sevenDaysAgo = new Date(now);
              sevenDaysAgo.setDate(now.getDate() - 7);
              return quoteDate >= sevenDaysAgo;
            case "last-30-days":
              const thirtyDaysAgo = new Date(now);
              thirtyDaysAgo.setDate(now.getDate() - 30);
              return quoteDate >= thirtyDaysAgo;
            case "this-month":
              return (
                quoteDate.getMonth() === now.getMonth() &&
                quoteDate.getFullYear() === now.getFullYear()
              );
            case "last-month":
              const lastMonth = new Date(now);
              lastMonth.setMonth(now.getMonth() - 1);
              return (
                quoteDate.getMonth() === lastMonth.getMonth() &&
                quoteDate.getFullYear() === lastMonth.getFullYear()
              );
            default:
              return true;
          }
        })
        .sort((a, b) => {
          // Apply sorting
          if (sortField === "amount") {
            return sortDirection === "asc" 
              ? a.amount - b.amount 
              : b.amount - a.amount;
          } else if (sortField === "date") {
            return sortDirection === "asc" 
              ? new Date(a.date).getTime() - new Date(b.date).getTime() 
              : new Date(b.date).getTime() - new Date(a.date).getTime();
          } else {
            const aValue = String(a[sortField]).toLowerCase();
            const bValue = String(b[sortField]).toLowerCase();
            return sortDirection === "asc" 
              ? aValue.localeCompare(bValue) 
              : bValue.localeCompare(aValue);
          }
        })
    : [];
  
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="inline-flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" /> New Quote
        </Button>
      </div>
      
      {/* Search and Filter Bar */}
      <Card className="bg-white p-4 shadow mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:w-52">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      
      {/* Quotes Table */}
      <Card className="bg-white shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("quoteNumber")}
                >
                  <div className="flex items-center">
                    Quote #
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("clientName")}
                >
                  <div className="flex items-center">
                    Client
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center">
                    Amount
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
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
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No quotes found
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
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
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredQuotes.length}</span> of <span className="font-medium">{filteredQuotes.length}</span> quotes
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
