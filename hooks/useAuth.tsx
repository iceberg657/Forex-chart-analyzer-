import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  email?: string;
  plan: 'Free' | 'Pro' | 'Apex';
  isGuest?: boolean;
}

interface AuthContextType {
  user: User;
  login: (email: string) => void;
  signup: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // Plan is always 'Free' now.
    setUser({ email, plan: 'Free', isGuest: false });
  };

  const signup = (email: string) => {
    // In a real app, this would involve a server call
    setUser({ email, plan: 'Free', isGuest: false });
  };
  
  const logout = () => {
    setUser({ plan: 'Free', isGuest: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
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
