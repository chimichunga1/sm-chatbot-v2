import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Quote } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface XeroExportButtonProps {
  quote: Quote;
  onSuccess?: (xeroQuoteUrl: string, xeroQuoteNumber: string) => void;
}

export function XeroExportButton({ quote, onSuccess }: XeroExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Don't show this button if already exported to Xero
  if (quote.xeroQuoteId) {
    return null;
  }

  const handleExportToXero = async () => {
    setIsExporting(true);
    try {
      const response = await apiRequest('POST', `/api/xero/export-quote/${quote.id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export to Xero');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Quote exported to Xero',
        description: 'The quote has been successfully exported to Xero',
        variant: 'default',
      });
      
      // Invalidate quotes cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quotes', quote.id] });
      
      if (onSuccess && result.invoiceUrl && result.invoiceNumber) {
        onSuccess(result.invoiceUrl, result.invoiceNumber);
      }
    } catch (error) {
      console.error('Error exporting to Xero:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export to Xero',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
        >
          <svg 
            className="h-4 w-4 text-amber-500" 
            viewBox="0 0 58 58" 
            fill="currentColor" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M42.9837 15.3718C44.7923 11.4218 48.3937 14.125 48.5916 14.2677C48.5916 14.2677 45.0923 8.32552 39.9216 8.36927C34.7487 8.41927 32.7173 12.3718 28.5394 21.2698C24.3616 30.1677 19.603 45.2646 19.603 45.2646C19.603 45.2646 28.9301 49.7552 33.5923 49.7552C38.5373 49.7552 42.093 47.6115 44.2973 42.0198C44.2973 42.0198 39.9237 41.5218 38.8623 37.9271C38.1373 35.5261 41.0066 33.3823 42.9858 29.0302C44.5473 25.5427 41.1752 19.2114 42.9837 15.3718Z" />
            <path d="M16.893 8.7677C11.7394 8.7677 7.7373 12.8677 7.7373 17.9219C7.7373 23.0739 11.693 27.0219 16.893 27.0219C22.093 27.0219 26.0951 23.0739 26.0951 17.9219C26.0951 12.7698 22.093 8.7677 16.893 8.7677Z" />
          </svg>
          Export to Xero
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Export to Xero</AlertDialogTitle>
          <AlertDialogDescription>
            This will create an invoice in Xero based on this quote. 
            The invoice will be created in draft status.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleExportToXero();
            }}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}