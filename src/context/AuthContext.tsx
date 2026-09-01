import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'user';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      if (data?.role === 'admin') return 'admin';
      return 'user';
    } catch {
      return 'user';
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const r = await fetchRole(data.session.user.id);
        if (mounted) setRole(r);
      }
      if (mounted) setLoading(false);
    });

    // Synchronous callback — no async to avoid Supabase deadlock
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Fire-and-forget role fetch — do NOT await inside the callback
        fetchRole(newSession.user.id).then((r) => {
          if (mounted) setRole(r);
        });
      } else {
        setRole(null);
      }

      if (event === 'SIGNED_OUT') {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message ?? null };
    if (!data.user) return { error: 'No user returned' };

    // Fetch role immediately so the redirect can happen without waiting for onAuthStateChange
    const r = await fetchRole(data.user.id);
    setRole(r);
    setUser(data.user);
    setSession(data.session);
    return { error: null };
  }, [fetchRole]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) return { error: error?.message ?? null };

    // Auto-login after registration
    if (data.user) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return { error: signInError.message ?? null };
      if (signInData.user) {
        const r = await fetchRole(signInData.user.id);
        setRole(r);
        setUser(signInData.user);
        setSession(signInData.session);
      }
    }
    return { error: null };
  }, [fetchRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
