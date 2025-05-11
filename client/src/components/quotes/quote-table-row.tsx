/**
 * Table Quote Row Component
 * Adds animation effects to individual quote rows
 */
import { useState } from "@/lib/react-compat";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Quote } from "@/types/quote";
import { formatCurrency, normalizeStatus } from "@/lib/utils";

interface QuoteTableRowProps {
  quote: Quote;
}

export function QuoteTableRow({ quote }: QuoteTableRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [location, navigate] = useLocation();

  // Handle row click with animation
  const handleRowClick = () => {
    setIsPressed(true);
    setTimeout(() => {
      navigate(`/quotes/${quote.id}/ai-chat`);
    }, 150);
  };

  return (
    <TableRow 
      key={quote.id}
      className={`cursor-pointer transition-all duration-150 ease-in-out group
        ${isHovered ? 'bg-gray-50' : ''}
        ${isPressed ? 'bg-black/5' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={handleRowClick}
      style={{
        transform: isPressed ? 'scale(0.99)' : isHovered ? 'scale(1.003)' : 'scale(1)',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease'
      }}
    >
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          className={`w-full group-hover:bg-black group-hover:text-white transition-colors duration-150 ${isPressed ? 'bg-black text-white' : ''}`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent double navigation
            navigate(`/quotes/${quote.id}/ai-chat`);
          }}
        >
          Open
        </Button>
      </TableCell>
      <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
      <TableCell>{quote.clientName}</TableCell>
      <TableCell>{quote.createdAt ? format(new Date(quote.createdAt), 'MMM d, yyyy') : 'N/A'}</TableCell>
      <TableCell>{formatCurrency(quote.totalAmount)}</TableCell>
      <TableCell>
        {quote.status.toLowerCase() === 'pending' ? (
          <div className="px-2 py-1 rounded-full text-xs font-semibold text-center w-fit border-2 border-gray-300 bg-gray-100 text-gray-800">
            Draft
          </div>
        ) : (
          <div className={`px-2 py-1 rounded-full text-xs font-semibold text-center w-fit
            ${normalizeStatus(quote.status) === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
            ${normalizeStatus(quote.status) === 'sent' ? 'bg-blue-100 text-blue-800' : ''}
            ${normalizeStatus(quote.status) === 'accepted' ? 'bg-green-100 text-green-800' : ''}
            ${normalizeStatus(quote.status) === 'rejected' ? 'bg-red-100 text-red-800' : ''}
            ${normalizeStatus(quote.status) === 'invoiced' ? 'bg-purple-100 text-purple-800' : ''}
          `}>
            {normalizeStatus(quote.status).charAt(0).toUpperCase() + normalizeStatus(quote.status).slice(1)}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}