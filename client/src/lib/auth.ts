import { User } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { signOut as firebaseSignOut } from "./firebase";

export type AuthStatus = {
  authenticated: boolean;
  user?: User;
};

// Check if user is authenticated
export async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    console.log("Checking authentication status...");
    
    const startTime = Date.now();
    const res = await fetch("/api/auth/status", {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Auth status response received in ${responseTime}ms, status: ${res.status}`);
    
    if (!res.ok) {
      console.warn(`Auth check failed with status: ${res.status}`);
      
      // Try to get more details about the error
      try {
        const errorData = await res.json();
        console.error("Auth error details:", errorData);
      } catch (parseError) {
        console.error("Could not parse auth error response");
      }
      
      return { authenticated: false };
    }
    
    const data = await res.json();
    console.log("Auth status:", data.authenticated ? "Authenticated" : "Not authenticated");
    return data;
  } catch (error) {
    console.error("Error checking authentication status:", error);
    
    // Check if this is a network error, which might indicate the server is down
    if (error instanceof TypeError && error.message.includes('network')) {
      console.error("Network error - server may be unavailable");
    }
    
    return { authenticated: false };
  }
}

// Logout function
export async function logout(): Promise<void> {
  try {
    console.log("Logging out user...");
    
    // Clear all storage related to auth
    localStorage.removeItem('lastLoginSuccess');
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    
    // Clear any cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // First sign out from Firebase if needed
    try {
      await firebaseSignOut();
    } catch (firebaseError) {
      console.warn("Firebase sign out error (continuing):", firebaseError);
    }
    
    // Then call server logout endpoint to destroy the session
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      console.warn(`Logout request returned status ${response.status}`);
      // Try a second attempt
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      } catch (retryError) {
        console.warn("Second logout attempt failed (continuing):", retryError);
      }
    }
    
    console.log("Logout successful, redirecting to login page");
    
    // Force a complete page reload to the auth page
    // This is more reliable than using React Router navigation
    console.log("Redirecting to auth page after logout");
    
    // Clear any remaining auth state in memory before redirect
    window.__LOGOUT_INITIATED = true;
    
    // Use setTimeout to ensure the browser has time to process the logout request
    setTimeout(() => {
      window.location.href = "/auth?force-logout=true&t=" + new Date().getTime();
    }, 100);
  } catch (error) {
    console.error("Error logging out:", error);
    
    // Even if there's an error, force navigation to login page
    // Clear client-side state as much as possible
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cookies by setting them to expire
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    } catch (e) {
      console.error("Error clearing session data:", e);
    }
    
    // Force redirect with error flag
    window.location.href = "/auth?force-logout=true&error=true&t=" + new Date().getTime();
  }
}

// Check if user is admin
export function isAdmin(user?: User): boolean {
  return user?.role === "admin";
}

// Update user profile
export async function updateUserProfile(userId: number, data: Partial<User>): Promise<User> {
  const res = await apiRequest("PUT", `/api/users/${userId}`, data);
  return await res.json();
}
