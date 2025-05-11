import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isRunningStandalone } from "@/lib/registerServiceWorker";

// This component has been disabled as per user request
export function InstallPrompt() {
  // Always return null to never show the install prompt
  return null;
}