import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

export default function Spinner({ size = "default", className }: SpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin text-muted-foreground", 
        sizeClass[size],
        className
      )} 
    />
  );
}