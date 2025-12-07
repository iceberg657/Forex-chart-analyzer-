
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
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setEdgeLight } = useEdgeLighting();
  const reactRouterNavigate = useNavigate();

  const navigate = (page: string) => {
    const pageMap: { [key: string]: string } = {
        home: '/',
        landing: '/',
        dashboard: '/dashboard',
        charting: '/charting',
        charts: '/charting',
        analysis: '/analysis',
        'market-news': '/market-news',
        journal: '/journal',
        coders: '/coders',
        'bot-maker': '/coders#bot-maker', // Scrolls to section
        'indicator-maker': '/coders#indicator-maker', // Scrolls to section
        pricing: '/pricing',
        predictor: '/predictor',
        'apex-ai': '/apex-ai',
        login: '/login', 
        signup: '/signup',
    };
    const path = pageMap[page.toLowerCase()] || '/';
    reactRouterNavigate(path);
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
