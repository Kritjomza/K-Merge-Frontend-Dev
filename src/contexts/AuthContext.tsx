// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';


// Interface for the user object we expect from Supabase
interface User {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: { [key: string]: any };
}

// Interface for the context's value
type ProfileRow = { [key: string]: any } | null;

interface AuthContextType {
  user: User | null;
  profile: ProfileRow;
  loading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch the current user's status from the backend
  const fetchUser = useCallback(async () => {
    try {
      // setLoading(true) is not strictly needed here on every call, 
      // but good for the initial load.
      const res = await fetch("/auth/me", { credentials: "include" });
      
      if (res.status === 401) {
        setUser(null);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch user status");
      }
      
      const data = await res.json();
      setUser(data.user || null);
      setProfile(data.profile || null);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to log the user out
  const logout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Run fetchUser on initial component mount
  useEffect(() => {
    fetchUser();

    // Add event listeners to refetch user on tab focus or visibility change
    // This helps update the session if the user logs in/out in another tab
    window.addEventListener('focus', fetchUser);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
            fetchUser();
        }
    });

    return () => {
      window.removeEventListener('focus', fetchUser);
      document.removeEventListener("visibilitychange", fetchUser);
    };
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
