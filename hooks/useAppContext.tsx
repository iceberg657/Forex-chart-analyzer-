import React, { createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useTheme } from './useTheme';
import { useEdgeLighting, EdgeLightColor } from './useEdgeLighting';

interface AppContextType {
  navigate: (page: string) => void;
  changeTheme: (theme: 'light' | 'dark') => void;
  setEdgeLight: (color: EdgeLightColor) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigateHook = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setEdgeLight } = useEdgeLighting();

  const navigate = (page: string) => {
    const pageMap: { [key: string]: string } = {
        home: user.isGuest ? '/' : '/dashboard',
        dashboard: '/dashboard',
        analysis: '/analysis',
        'market-news': '/market-news',
        journal: '/journal',
        coders: '/introduction',
        'bot-maker': '/bot-maker',
        'indicator-maker': '/indicator-maker',
        pricing: '/pricing',
        login: '/login',
        signup: '/signup',
    };
    const path = pageMap[page.toLowerCase()] || '/';
    navigateHook(path);
  };

  const changeTheme = (newTheme: 'light' | 'dark') => {
    if (theme !== newTheme) {
      toggleTheme();
    }
  };

  const value = {
    navigate,
    changeTheme,
    setEdgeLight,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
