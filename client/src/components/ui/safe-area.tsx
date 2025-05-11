import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isIOS, isPWA } from "@/lib/utils";

interface SafeAreaProps {
  children: ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

/**
 * SafeArea component that handles safe areas for iOS notch and home indicator
 * This is designed to work in both browser and when added to home screen as PWA
 */
export function SafeArea({ 
  children, 
  className,
  top = true,
  bottom = true,
  left = true,
  right = true
}: SafeAreaProps) {
  const isIOSDevice = isIOS();
  const isPWAMode = isPWA();
  
  // Only apply safe areas if in iOS PWA mode
  const shouldApplySafeAreas = isIOSDevice && isPWAMode;
  
  return (
    <div 
      className={cn(
        className,
        shouldApplySafeAreas && top && "pt-safe-top",
        shouldApplySafeAreas && bottom && "pb-safe-bottom",
        shouldApplySafeAreas && left && "pl-safe-left",
        shouldApplySafeAreas && right && "pr-safe-right"
      )}
    >
      {children}
    </div>
  );
}

/**
 * SafeAreaTop adds padding only to the top for iOS notch
 */
export function SafeAreaTop({ children, className }: Omit<SafeAreaProps, 'top' | 'bottom' | 'left' | 'right'>) {
  return (
    <SafeArea className={className} top={true} bottom={false} left={false} right={false}>
      {children}
    </SafeArea>
  );
}

/**
 * SafeAreaBottom adds padding only to the bottom for iOS home indicator
 */
export function SafeAreaBottom({ children, className }: Omit<SafeAreaProps, 'top' | 'bottom' | 'left' | 'right'>) {
  return (
    <SafeArea className={className} top={false} bottom={true} left={false} right={false}>
      {children}
    </SafeArea>
  );
}

/**
 * SafeAreaInsetTop returns the calculated inset value for dynamic sizing
 * Useful for calculations in JS
 */
export function safeAreaInsetTop() {
  if (isIOS() && isPWA()) {
    // Modern iPhones with notch or dynamic island
    return "env(safe-area-inset-top)";
  }
  return "0px";
}

/**
 * SafeAreaInsetBottom returns the calculated inset value for dynamic sizing
 * Useful for calculations in JS
 */
export function safeAreaInsetBottom() {
  if (isIOS() && isPWA()) {
    // Modern iPhones with home indicator
    return "env(safe-area-inset-bottom)";
  }
  return "0px";
}