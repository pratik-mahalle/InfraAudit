import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { unwrapResponse } from "@/lib/queryClient";
import { isPersonalEmail, BUSINESS_EMAIL_ERROR } from "@/lib/utils";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  needsSignup: boolean;
  pendingApproval: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: { username?: string; fullName?: string }
  ) => Promise<void>;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
  signOut: () => Promise<void>;
  completeSignup: (orgName: string, fullName?: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

type ProfileResult = { user: User | null; needsSignup: boolean; pendingApproval: boolean };

async function fetchProfile(accessToken: string): Promise<ProfileResult> {
  try {
    const res = await fetch(`${API_BASE}/api/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    if (!res.ok) return { user: null, needsSignup: false, pendingApproval: false };
    const json = await res.json();
    const data = unwrapResponse<any>(json);
    if (data?.needsSignup || data?.needsOrg) {
      return { user: null, needsSignup: true, pendingApproval: false };
    }
    if (data?.pending_approval) {
      return { user: data as User, needsSignup: false, pendingApproval: true };
    }
    return { user: data as User, needsSignup: false, pendingApproval: false };
  } catch {
    return { user: null, needsSignup: false, pendingApproval: false };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  // Fetch profile from Go backend using Supabase JWT
  const loadProfile = useCallback(async (sess: Session | null) => {
    if (!sess?.access_token) {
      setUser(null);
      setNeedsSignup(false);
      setPendingApproval(false);
      return;
    }
    const result = await fetchProfile(sess.access_token);
    setUser(result.user);
    setNeedsSignup(result.needsSignup);
    setPendingApproval(result.pendingApproval);
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
      if (isPersonalEmail(email)) throw new Error(BUSINESS_EMAIL_ERROR);
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
      if (isPersonalEmail(email)) throw new Error(BUSINESS_EMAIL_ERROR);
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
        description: "Account created!",
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

  const completeSignup = useCallback(
    async (orgName: string, fullName?: string) => {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ org_name: orgName, full_name: fullName || "" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = (json.error as Record<string, unknown>)?.message || "Signup failed";
        throw new Error(String(msg));
      }
      // Reload profile after successful signup
      setNeedsSignup(false);
      await loadProfile(session);
    },
    [session, loadProfile]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
    setSession(null);
    // Also clear Go backend cookies
    try {
      await fetch(`${API_BASE}/api/logout`, { method: "POST", credentials: "include" });
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
        needsSignup,
        pendingApproval,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
        completeSignup,
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
