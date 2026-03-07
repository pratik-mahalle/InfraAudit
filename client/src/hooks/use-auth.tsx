import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { unwrapResponse } from "@/lib/queryClient";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: { username?: string; fullName?: string }
  ) => Promise<void>;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch("/api/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return unwrapResponse<User>(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile from Go backend using Supabase JWT
  const loadProfile = useCallback(async (sess: Session | null) => {
    if (!sess?.access_token) {
      setUser(null);
      return;
    }
    const profile = await fetchProfile(sess.access_token);
    setUser(profile);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      loadProfile(initialSession).finally(() => setIsLoading(false));
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadProfile(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    [toast]
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      metadata?: { username?: string; fullName?: string }
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: metadata?.username || "",
            full_name: metadata?.fullName || "",
          },
        },
      });
      if (error) throw new Error(error.message);
      toast({
        title: "Registration successful",
        description: "Welcome to InfraAudit!",
      });
    },
    [toast]
  );

  const signInWithOAuth = useCallback(
    async (provider: "google" | "github") => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw new Error(error.message);
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
    setSession(null);
    // Also clear Go backend cookies
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {
      // Ignore errors clearing server cookies
    }
    toast({
      title: "Logged out",
      description: "You have been logged out.",
    });
  }, [toast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
