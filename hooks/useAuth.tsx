import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

interface User {
  email?: string;
  plan: 'Free' | 'Pro' | 'Apex';
  isGuest?: boolean;
}

interface AuthContextType {
  user: User;
  usage: { bots: number; indicators: number };
  login: (email: string) => void;
  signup: (email: string) => void;
  logout: () => void;
  incrementBotUsage: () => boolean;
  incrementIndicatorUsage: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_FREE_BOTS = 1;
const MAX_FREE_INDICATORS = 1;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error("Could not parse auth user from localStorage", error);
      localStorage.removeItem('authUser');
    }
    return { plan: 'Free', isGuest: true };
  });

  const [usage, setUsage] = useState({ bots: 0, indicators: 0 });

  useEffect(() => {
    try {
      if (!user.isGuest) {
        localStorage.setItem('authUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('authUser');
      }
    } catch (error) {
      console.error("Could not save auth user to localStorage", error);
    }
  }, [user]);


  const login = (email: string) => {
    setUser({ email, plan: 'Free', isGuest: false });
    setUsage({ bots: 0, indicators: 0 }); // Reset usage on login
  };

  const signup = (email: string) => {
    // In a real app, this would involve a server call
    setUser({ email, plan: 'Free', isGuest: false });
    setUsage({ bots: 0, indicators: 0 });
  };
  
  const logout = () => {
    setUser({ plan: 'Free', isGuest: true });
    setUsage({ bots: 0, indicators: 0 });
  };

  const incrementBotUsage = useCallback(() => {
    if (user?.plan === 'Free' && usage.bots >= MAX_FREE_BOTS) {
      return false;
    }
    setUsage(prev => ({ ...prev, bots: prev.bots + 1 }));
    return true;
  }, [user, usage.bots]);

  const incrementIndicatorUsage = useCallback(() => {
    if (user?.plan === 'Free' && usage.indicators >= MAX_FREE_INDICATORS) {
      return false;
    }
    setUsage(prev => ({ ...prev, indicators: prev.indicators + 1 }));
    return true;
  }, [user, usage.indicators]);

  return (
    <AuthContext.Provider value={{ user, usage, login, signup, logout, incrementBotUsage, incrementIndicatorUsage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};