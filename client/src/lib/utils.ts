import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

/**
 * Combines class names using clsx and tailwind-merge
 * This util works the same in React Native with libraries like nativewind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string or object to a readable date
 * Compatible with both web and React Native
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Format a number as currency (USD)
 * Compatible with both web and React Native
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "$0.00";
  
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return "$0.00";
  }
}

/**
 * Get a color for a status that works in both Web and React Native
 */
export function getStatusColor(status: string): { 
  bgColor: string; 
  textColor: string;
} {
  switch (status.toLowerCase()) {
    case "draft":
      return { bgColor: "bg-gray-100", textColor: "text-gray-800" };
    case "sent":
      return { bgColor: "bg-blue-100", textColor: "text-blue-800" };
    case "accepted":
      return { bgColor: "bg-green-100", textColor: "text-green-700" };
    case "rejected":
      return { bgColor: "bg-red-100", textColor: "text-red-700" };
    case "invoiced":
      return { bgColor: "bg-purple-100", textColor: "text-purple-700" };
    default:
      return { bgColor: "bg-gray-100", textColor: "text-gray-700" };
  }
}

/**
 * Get a badge color based on status for shadcn UI badge component
 */
// This function normalizes status values, converting 'pending' to 'draft'
export function normalizeStatus(status: string): string {
  // Convert any 'pending' status to 'draft'
  if (status.toLowerCase() === 'pending') {
    return 'draft';
  }
  return status;
}

export function getStatusBadgeColor(status: string): string {
  // Normalize the status first (converts 'pending' to 'draft')
  status = normalizeStatus(status);
  
  switch (status.toLowerCase()) {
    case "draft":
      return "secondary";
    case "sent":
      return "blue";
    case "accepted":
      return "green";
    case "rejected":
      return "destructive";
    case "invoiced":
      return "purple";
    case "active":
      return "green";
    case "inactive":
      return "secondary";
    default:
      return "secondary";
  }
}

/**
 * Check if we're on iOS
 */
export function isIOS(): boolean {
  if (typeof window !== "undefined" && window.navigator) {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }
  return false;
}

/**
 * Check if running as a PWA or standalone app
 */
export function isPWA(): boolean {
  if (typeof window !== "undefined") {
    return window.matchMedia("(display-mode: standalone)").matches || 
           (window.navigator as any).standalone === true;
  }
  return false;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return "";
  
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Cross-platform delay function (better than setTimeout in some contexts)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe stringify any value
 * Avoids circular references and handles error states
 */
export function safeStringify(value: any): string {
  try {
    return JSON.stringify(value, (_key, val) => {
      if (val !== null && typeof val === "object") {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    });
  } catch (error) {
    return `[Error serializing value: ${error}]`;
  }
  finally {
    seen.clear();
  }
}

// Set for tracking circular references
const seen = new Set();

/**
 * Safe parse a JSON string
 * Returns null instead of throwing for invalid JSON
 */
export function safeParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}