import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { signOut } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Types
type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  companyId: number;
  isActive: boolean;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

type AuthContextType = AuthState & {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  // Fetch current user
  const fetchUser = async (): Promise<User | null> => {
    try {
      const res = await apiRequest("GET", "/api/auth/status");
      const data = await res.json();
      
      if (data.authenticated && data.user) {
        return data.user;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      throw error;
    }
  };

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await fetchUser();
        setAuthState({ user, isLoading: false, error: null });
      } catch (error) {
        setAuthState({ user: null, isLoading: false, error: error as Error });
      }
    };

    loadUser();
  }, []);

  // Login mutation
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      setAuthState({ user: data.user, isLoading: false, error: null });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Register mutation
  const register = async (data: RegisterData): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const res = await apiRequest("POST", "/api/auth/register", data);
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.message || "Registration failed");
      }
      
      setAuthState({ user: responseData.user, isLoading: false, error: null });
      toast({
        title: "Registration successful",
        description: responseData.message || "Your account has been created",
      });
      
      // Navigate to dashboard after successful registration
      navigate("/dashboard");
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut();
      setAuthState({ user: null, isLoading: false, error: null });
      queryClient.clear();
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Reload user
  const reloadUser = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const user = await fetchUser();
      setAuthState({ user, isLoading: false, error: null });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error as Error }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}