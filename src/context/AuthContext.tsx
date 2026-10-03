import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'user' | 'agent';

type UserProfile = {
  role: UserRole;
  can_publish: boolean;
  is_blocked: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  canPublish: boolean;
  isBlocked: boolean;
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
  const [canPublish, setCanPublish] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile> => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('role, can_publish, is_blocked')
        .eq('id', userId)
        .maybeSingle();
      if (data) {
        return {
          role: (data.role as UserRole) || 'user',
          can_publish: data.can_publish ?? false,
          is_blocked: data.is_blocked ?? false,
        };
      }
      return { role: 'user', can_publish: false, is_blocked: false };
    } catch {
      return { role: 'user', can_publish: false, is_blocked: false };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id);
        if (mounted) {
          setRole(p.role);
          setCanPublish(p.can_publish);
          setIsBlocked(p.is_blocked);
          if (p.is_blocked) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setRole(null);
          }
        }
      }
      if (mounted) setLoading(false);
    });

    // Synchronous callback — no async to avoid Supabase deadlock
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Fire-and-forget profile fetch — do NOT await inside the callback
        fetchProfile(newSession.user.id).then((p) => {
          if (mounted) {
            setRole(p.role);
            setCanPublish(p.can_publish);
            setIsBlocked(p.is_blocked);
            if (p.is_blocked) {
              supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setRole(null);
            }
          }
        });
      } else {
        setRole(null);
        setCanPublish(false);
        setIsBlocked(false);
      }

      if (event === 'SIGNED_OUT') {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message ?? null };
    if (!data.user) return { error: 'No user returned' };

    // Fetch profile immediately so the redirect can happen without waiting for onAuthStateChange
    const p = await fetchProfile(data.user.id);
    if (p.is_blocked) {
      await supabase.auth.signOut();
      return { error: 'Account blocked' };
    }
    setRole(p.role);
    setCanPublish(p.can_publish);
    setIsBlocked(false);
    setUser(data.user);
    setSession(data.session);
    return { error: null };
  }, [fetchProfile]);

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
        const p = await fetchProfile(signInData.user.id);
        setRole(p.role);
        setCanPublish(p.can_publish);
        setIsBlocked(false);
        setUser(signInData.user);
        setSession(signInData.session);
      }
    }
    return { error: null };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
    setCanPublish(false);
    setIsBlocked(false);
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, role, canPublish, isBlocked, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
