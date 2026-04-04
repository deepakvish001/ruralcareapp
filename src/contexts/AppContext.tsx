import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Language, t as translate } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'patient' | 'healthWorker' | 'doctor' | 'admin';

interface AppContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  isAdmin: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  t: (key: string) => string;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRoleState] = useState<UserRole | null>(() => {
    return (localStorage.getItem('ruralcare_role') as UserRole) || null;
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('ruralcare_lang') as Language) || 'en';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('ruralcare_dark') === 'true';
  });

  useEffect(() => {
    // Set up auth listener BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid potential Supabase client deadlock
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', newSession.user.id)
                .single();
              if (profile?.role) {
                setRoleState(profile.role as UserRole);
                localStorage.setItem('ruralcare_role', profile.role);
              }
              // Check admin status
              const { data: adminRole } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', newSession.user.id)
                .eq('role', 'admin')
                .maybeSingle();
              setIsAdmin(!!adminRole);
            } catch (e) {
              console.error('Failed to fetch profile role:', e);
            }
            setLoading(false);
          }, 0);
        } else {
          setLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (!existingSession) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setRole = async (newRole: UserRole | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('ruralcare_role', newRole);
      if (user) {
        try {
          await supabase.from('profiles').update({ role: newRole }).eq('user_id', user.id);
        } catch (e) {
          console.error('Failed to update profile role:', e);
        }
      }
    } else {
      localStorage.removeItem('ruralcare_role');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoleState(null);
    localStorage.removeItem('ruralcare_role');
  };

  useEffect(() => {
    localStorage.setItem('ruralcare_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('ruralcare_dark', String(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const t = (key: string) => translate(key, language);

  return (
    <AppContext.Provider value={{ role, setRole, isAdmin, language, setLanguage, darkMode, setDarkMode, t, user, session, loading, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
