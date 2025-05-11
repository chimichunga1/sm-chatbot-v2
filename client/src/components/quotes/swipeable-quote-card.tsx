/**
 * Quote Card Component
 * Refactored to use the React compatibility layer for forward compatibility with React 19
 */
import { useState, useRef } from '@/lib/react-compat';
import { useLocation } from 'wouter';
import { Quote } from '@/types/quote';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, normalizeStatus } from '@/lib/utils';

interface SwipeableQuoteCardProps {
  quote: Quote;
  onDelete: (id: number) => void;
  onViewDetails: (id: number) => void;
}

export function SwipeableQuoteCard({ quote, onViewDetails }: SwipeableQuoteCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [location, navigate] = useLocation();
  
  // Animation states
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Function to render the appropriate status badge
  const renderStatusBadge = (status: string) => {
    // Check if status is pending specifically to add the border
    if (status.toLowerCase() === 'pending') {
      return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-2 border-gray-300">Draft</Badge>;
    }
    
    // For all other statuses, normalize then display
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'draft':
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-700">Draft</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Sent</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Rejected</Badge>;
      case 'invoiced':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Invoiced</Badge>;
      default:
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-700">Draft</Badge>;
    }
  };
  
  // Handle navigation with animation
  const handleCardClick = () => {
    // First play the press animation
    setIsPressed(true);
    
    // After a short delay, navigate to the quote detail page
    setTimeout(() => {
      navigate(`/quotes/${quote.id}/ai-chat`);
    }, 150);
  };

  // Calculate styles based on state
  const getCardStyle = () => {
    return {
      transform: `scale(${isPressed ? 0.97 : isHovered ? 1.02 : 1})`,
      boxShadow: isPressed 
        ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
        : isHovered 
          ? '0 10px 25px rgba(0, 0, 0, 0.1)' 
          : '0 2px 5px rgba(0, 0, 0, 0.05)',
      borderColor: isHovered ? '#000' : '#e5e7eb',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
    };
  };
  
  return (
    <div
      ref={cardRef}
      style={getCardStyle()}
      className="bg-white border rounded-lg overflow-hidden my-2 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={handleCardClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => {
        setIsPressed(false);
        handleCardClick();
      }}
    >
      <div className="block p-4">
        <div className="flex flex-col">
          {/* Top line - Business name with text shadow / Quote number on right */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-black truncate flex-1">{quote.clientName}</h3>
            <div className="flex items-center">
              <span className="font-semibold text-sm text-gray-600">{quote.quoteNumber}</span>
              {isHovered && (
                <ExternalLink className="h-4 w-4 ml-1 text-gray-500" />
              )}
            </div>
          </div>
          
          {/* Bottom line - Value on left, status on right */}
          <div className="flex items-center justify-between mt-2">
            <span className="font-medium text-sm">{formatCurrency(quote.totalAmount || 0)}</span>
            {renderStatusBadge(quote.status)}
          </div>
        </div>
      </div>
    </div>
  );
}