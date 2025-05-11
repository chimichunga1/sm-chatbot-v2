import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    firebaseSignOut?: () => Promise<void>;
  }
}

/**
 * Sign out from backend session
 * This is a simplified version that doesn't use Firebase anymore
 */
export async function signOut(): Promise<void> {
  try {
    console.log("Firebase compatibility signOut function called");
    
    // Import and use the centralized logout function
    // This ensures consistency across all logout methods
    const { logout } = await import('@/lib/auth');
    await logout();
    
    // The main logout function handles all cleanup and redirection
    // No need for additional code here
  } catch (error) {
    console.error("Error in firebase signOut:", error);
    
    // Attempt basic cleanup as fallback
    localStorage.removeItem('lastLoginSuccess');
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    
    // Try to logout via API as fallback
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error("Error in fallback logout request:", e);
    }
    
    // Force navigation to auth page even on error
    window.location.href = '/auth?force-logout=true&error=true&t=' + new Date().getTime();
    
    throw error;
  }
}

// Expose the signOut function globally for legacy compatibility
window.firebaseSignOut = signOut;