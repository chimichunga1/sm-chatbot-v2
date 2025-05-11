import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { ExternalLink } from 'lucide-react';
import { Quote } from '@shared/schema';

interface XeroLinkProps {
  quote: Quote;
}

export function XeroLink({ quote }: XeroLinkProps) {
  if (!quote.xeroQuoteId || !quote.xeroQuoteUrl) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              if (quote.xeroQuoteUrl) {
                window.open(quote.xeroQuoteUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            aria-label="View in Xero"
          >
            <svg 
              className="h-5 w-5 text-amber-500" 
              viewBox="0 0 58 58" 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M42.9837 15.3718C44.7923 11.4218 48.3937 14.125 48.5916 14.2677C48.5916 14.2677 45.0923 8.32552 39.9216 8.36927C34.7487 8.41927 32.7173 12.3718 28.5394 21.2698C24.3616 30.1677 19.603 45.2646 19.603 45.2646C19.603 45.2646 28.9301 49.7552 33.5923 49.7552C38.5373 49.7552 42.093 47.6115 44.2973 42.0198C44.2973 42.0198 39.9237 41.5218 38.8623 37.9271C38.1373 35.5261 41.0066 33.3823 42.9858 29.0302C44.5473 25.5427 41.1752 19.2114 42.9837 15.3718Z" />
              <path d="M16.893 8.7677C11.7394 8.7677 7.7373 12.8677 7.7373 17.9219C7.7373 23.0739 11.693 27.0219 16.893 27.0219C22.093 27.0219 26.0951 23.0739 26.0951 17.9219C26.0951 12.7698 22.093 8.7677 16.893 8.7677Z" />
            </svg>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col">
            <span>View in Xero</span>
            {quote.xeroQuoteNumber && (
              <span className="text-xs text-muted-foreground">
                Xero Invoice #{quote.xeroQuoteNumber}
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function XeroButtonLink({ quote }: XeroLinkProps) {
  if (!quote.xeroQuoteId || !quote.xeroQuoteUrl) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => {
        if (quote.xeroQuoteUrl) {
          window.open(quote.xeroQuoteUrl, '_blank', 'noopener,noreferrer');
        }
      }}
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
      <span>View in Xero</span>
      <ExternalLink className="h-3 w-3 ml-1" />
    </Button>
  );
}

export function XeroLinkText({ quote }: XeroLinkProps) {
  if (!quote.xeroQuoteId || !quote.xeroQuoteUrl) {
    return null;
  }

  return (
    <a 
      href={quote.xeroQuoteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center text-sm text-muted-foreground hover:text-foreground gap-1.5 transition-colors"
    >
      <svg 
        className="h-3.5 w-3.5 text-amber-500" 
        viewBox="0 0 58 58" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M42.9837 15.3718C44.7923 11.4218 48.3937 14.125 48.5916 14.2677C48.5916 14.2677 45.0923 8.32552 39.9216 8.36927C34.7487 8.41927 32.7173 12.3718 28.5394 21.2698C24.3616 30.1677 19.603 45.2646 19.603 45.2646C19.603 45.2646 28.9301 49.7552 33.5923 49.7552C38.5373 49.7552 42.093 47.6115 44.2973 42.0198C44.2973 42.0198 39.9237 41.5218 38.8623 37.9271C38.1373 35.5261 41.0066 33.3823 42.9858 29.0302C44.5473 25.5427 41.1752 19.2114 42.9837 15.3718Z" />
        <path d="M16.893 8.7677C11.7394 8.7677 7.7373 12.8677 7.7373 17.9219C7.7373 23.0739 11.693 27.0219 16.893 27.0219C22.093 27.0219 26.0951 23.0739 26.0951 17.9219C26.0951 12.7698 22.093 8.7677 16.893 8.7677Z" />
      </svg>
      {quote.xeroQuoteNumber ? 
        <span>Xero #{quote.xeroQuoteNumber}</span> : 
        <span>View in Xero</span>
      }
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}