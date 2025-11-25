


import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  email?: string;
  plan: 'Free' | 'Pro' | 'Apex';
  isGuest?: boolean;
}

interface AuthContextType {
  user: User;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
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

  const [error, setError] = useState<string | null>(null);

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

  const clearError = () => setError(null);

  // Helper to simulate DB delay
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const login = async (email: string, password?: string) => {
    setError(null);
    await wait(800); // Simulate network request

    if (password) {
        // Simulate checking against a database
        const storedCreds = localStorage.getItem(`user_creds_${email}`);
        if (!storedCreds) {
            setError("Account not found. Please sign up first.");
            throw new Error("Account not found");
        }
        
        const credentials = JSON.parse(storedCreds);
        if (credentials.password !== password) {
            // Explicit error for mismatch
            setError("The email and password do not match. Please try again.");
            throw new Error("Invalid credentials");
        }
        
        // Check if this was originally a Google account trying to use password
        if (credentials.provider === 'google' && !credentials.password) {
             setError("This account was created with Google. Please use 'Sign in with Google'.");
             throw new Error("Use Google Sign-In");
        }
    }

    // Success
    setUser({ email, plan: 'Free', isGuest: false });
  };

  const loginWithGoogle = async () => {
      setError(null);
      await wait(800); // Simulate Google popup interaction
      
      // Simulating a successful Google login without complex linking logic for now
      // This is a direct simulation for the demo environment
      setUser({ email: 'alex.trader@gmail.com', plan: 'Free', isGuest: false });
  };

  const signup = async (email: string, password?: string) => {
    setError(null);
    await wait(800);

    // Simulate checking if user exists
    if (localStorage.getItem(`user_creds_${email}`)) {
        setError("An account with this email already exists. Please log in.");
        throw new Error("User exists");
    }

    // "Save" user to "Database"
    if (password) {
        localStorage.setItem(`user_creds_${email}`, JSON.stringify({ 
            email, 
            password,
            provider: 'email',
            createdAt: new Date().toISOString()
        }));
    }

    setUser({ email, plan: 'Free', isGuest: false });
  };
  
  const logout = () => {
    setUser({ plan: 'Free', isGuest: true });
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, error, clearError }}>
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
