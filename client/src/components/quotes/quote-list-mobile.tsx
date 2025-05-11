/**
 * Mobile Quote List Component
 * Refactored to use the React compatibility layer for forward compatibility with React 19
 */
import { useLocation } from 'wouter';
import { SwipeableQuoteCard } from './swipeable-quote-card';
import { Quote } from '@/types/quote';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface QuoteListMobileProps {
  quotes: Quote[];
  onDeleteQuote?: (id: number) => Promise<void>; // Made optional since we're removing delete functionality
  isRefetching?: boolean;
}

export function QuoteListMobile({ quotes, isRefetching = false }: QuoteListMobileProps) {
  const [location, navigate] = useLocation();

  // View details handler - navigates to AI chat view
  const handleViewDetails = (id: number) => {
    navigate(`/quotes/${id}/ai-chat`);
  };

  if (!quotes || quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-lg border h-64">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No quotes found</h3>
        <p className="text-sm text-gray-500">
          {isRefetching 
            ? "Refreshing your quotes..." 
            : "Create your first quote to get started."}
        </p>
        {isRefetching && (
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mt-4" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 pb-4">
      {quotes.map((quote) => (
        <SwipeableQuoteCard 
          key={quote.id}
          quote={quote}
          onDelete={() => {}} // Empty function as we've removed delete functionality
          onViewDetails={handleViewDetails}
        />
      ))}
    </div>
  );
}