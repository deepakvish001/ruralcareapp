import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, t as translate } from '@/i18n/translations';

export type UserRole = 'patient' | 'healthWorker' | 'doctor';

interface AppContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem('ruralcare_role') as UserRole) || null;
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('ruralcare_lang') as Language) || 'en';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('ruralcare_dark') === 'true';
  });

  useEffect(() => {
    if (role) localStorage.setItem('ruralcare_role', role);
    else localStorage.removeItem('ruralcare_role');
  }, [role]);

  useEffect(() => {
    localStorage.setItem('ruralcare_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('ruralcare_dark', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const t = (key: string) => translate(key, language);

  return (
    <AppContext.Provider value={{ role, setRole, language, setLanguage, darkMode, setDarkMode, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
