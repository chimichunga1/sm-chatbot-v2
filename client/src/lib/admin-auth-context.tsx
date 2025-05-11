import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

type AdminLoginCredentials = {
  username: string;
  password: string;
};

type AdminAuthContextType = {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: AdminLoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  reloadAdminUser: () => Promise<void>;
};

// Create the context
const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

// Provider component
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Function to check authentication status
  const checkAuthStatus = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setAdminUser(null);
        setIsLoading(false);
        return;
      }
      
      // Use apiRequest for consistency
      const response = await apiRequest('GET', '/api/admin-auth/status', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminUser(data.user);
      } else {
        setAdminUser(null);
        localStorage.removeItem('adminToken');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAdminUser(null);
      localStorage.removeItem('adminToken');
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (credentials: AdminLoginCredentials) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/admin-auth/login', credentials);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      setAdminUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function - handles both admin token and regular session
  const logout = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (token) {
        // The server will handle both admin token invalidation and regular session logout
        await apiRequest('POST', '/api/admin-auth/logout', null, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include' // Important for session cookies to be included
        });
        
        // Also make sure we logout from regular session on client-side
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (sessionLogoutError) {
          // Log but continue even if session logout fails
          console.error('Session logout error:', sessionLogoutError);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error; // Rethrow to be handled by the calling component
    } finally {
      localStorage.removeItem('adminToken');
      setAdminUser(null);
      setIsLoading(false);
    }
  };

  // Reload user data
  const reloadAdminUser = async () => {
    return checkAuthStatus();
  };

  const value = {
    adminUser,
    isAuthenticated: !!adminUser,
    isLoading,
    error,
    login,
    logout,
    reloadAdminUser
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  
  return context;
}