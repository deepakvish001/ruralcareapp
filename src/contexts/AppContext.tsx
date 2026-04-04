import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, t as translate } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'patient' | 'healthWorker' | 'doctor';

interface AppContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
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
  const [role, setRoleState] = useState<UserRole | null>(() => {
    return (localStorage.getItem('ruralcare_role') as UserRole) || null;
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('ruralcare_lang') as Language) || 'en';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('ruralcare_dark') === 'true';
  });

  // Auth state listener — set up BEFORE getSession per Supabase best practice
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile role if logged in
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          if (profile?.role) {
            setRoleState(profile.role as UserRole);
            localStorage.setItem('ruralcare_role', profile.role);
          }
        }
        setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setRole = async (role: UserRole | null) => {
    setRoleState(role);
    if (role) {
      localStorage.setItem('ruralcare_role', role);
      // Persist to profile in DB
      if (user) {
        await supabase.from('profiles').update({ role }).eq('user_id', user.id);
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
    <AppContext.Provider value={{ role, setRole, language, setLanguage, darkMode, setDarkMode, t, user, session, loading, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
