import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import App from "./App";
import "./index.css";
import "./styles/safe-area.css"; // Import safe area styles for iOS PWA support
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Import firebase to initialize global functions
import "./lib/firebase";

// Function to detect if app is running in standalone mode (PWA)
// This helps with properly handling iOS safe areas when added to home screen
function detectStandaloneMode() {
  // TypeScript fix: navigator.standalone is only available on iOS Safari
  // Using type assertion to avoid TypeScript errors
  const nav = window.navigator as any;

  const isStandalone = 
    (nav.standalone === true) || // iOS
    window.matchMedia('(display-mode: standalone)').matches; // Android/Desktop

  // Detect iOS device first
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (isIOS) {
    document.documentElement.classList.add('ios-device');
  }

  if (isStandalone) {
    // Add class to html element for standalone-specific CSS
    document.documentElement.classList.add('standalone-mode');

    // Add specific iOS PWA class if applicable
    if (isIOS && nav.standalone === true) {
      document.documentElement.classList.add('ios-pwa');

      // Don't apply padding directly to body - let CSS handle this
      // Instead just add more specific classes for different iOS versions

      // Try to detect iPhone model with notch or dynamic island
      const isModernIphone = /iPhone/.test(navigator.userAgent) && 
                              (window.screen.height > 800 || window.screen.width > 800);

      if (isModernIphone) {
        document.documentElement.classList.add('ios-modern');
      }

      // Prevent scroll issues immediately
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
    }
  }
}

// Fix TypeScript errors by delaying detection until document is fully loaded
// instead of running it immediately during module evaluation
if (document.readyState === 'complete') {
  detectStandaloneMode();
} else {
  window.addEventListener('load', detectStandaloneMode);
}

// Wrap App with PWA detection
function AppWithPWASupport() {
  useEffect(() => {
    // Run detection immediately for iOS
    detectStandaloneMode();

    // Run it again after a short delay to ensure DOM is fully loaded
    const detectTimer = setTimeout(() => {
      detectStandaloneMode();
    }, 100);

    // Also listen for display mode changes
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => detectStandaloneMode();
    mql.addEventListener('change', handleChange);

    // Listen for orientation changes to reapply safe areas
    window.addEventListener('resize', detectStandaloneMode);

    return () => {
      clearTimeout(detectTimer);
      mql.removeEventListener('change', handleChange);
      window.removeEventListener('resize', detectStandaloneMode);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

// AuthProvider is now part of the App component
createRoot(document.getElementById("root")!).render(
  <AppWithPWASupport />
);

// Remove Replit popup elements
document.addEventListener('DOMContentLoaded', () => {
  // Find and remove Replit-related elements
  const replitElements = document.querySelectorAll('[class*="replit-"]');
  replitElements.forEach(el => el.remove());

  // Remove any Replit-related iframes
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    if (iframe.src && iframe.src.includes('replit')) {
      iframe.remove();
    }
  });
});