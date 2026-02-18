import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';

interface User {
  email?: string;
  plan: 'Free' | 'Pro' | 'Apex';
  isGuest?: boolean;
  uid?: string;
}

interface AuthContextType {
  user: User;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>({ plan: 'Free', isGuest: true });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase config not found. Running in Guest Mode.");
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email || undefined,
          uid: firebaseUser.uid,
          plan: 'Free', // Default plan
          isGuest: false
        });
      } else {
        setUser({ plan: 'Free', isGuest: true });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const getFriendlyErrorMessage = (err: AuthError) => {
    console.error("Auth Error Code:", err.code, "Full Error:", err);
    switch (err.code) {
        case 'auth/network-request-failed':
            return "Network request failed. This often happens in sandboxed environments (like AI Studio) if the connection to Google Auth is restricted. Please ensure your project is authorized or use Email/Password if popups are blocked.";
        case 'auth/invalid-credential':
            return "Invalid login credentials. Please check your email and password.";
        case 'auth/user-not-found':
            return "Account not found. Please sign up first.";
        case 'auth/wrong-password':
            return "Incorrect password. Please try again.";
        case 'auth/email-already-in-use':
            return "That email is already in use.";
        case 'auth/weak-password':
            return "Password should be at least 6 characters.";
        case 'auth/popup-closed-by-user':
            return null;
        case 'auth/cancelled-popup-request':
            return null;
        case 'auth/operation-not-allowed':
            return "Auth method not enabled in console.";
        case 'auth/unauthorized-domain':
            return "This domain is not authorized for Firebase Auth. Add it in the Firebase Console.";
        case 'auth/popup-blocked':
            return "Sign-in popup blocked. Please enable popups or use Email/Password.";
        case 'auth/invalid-email':
            return "Invalid email address format.";
        default:
            return err.message || "Authentication failed. Please try again later.";
    }
  };

  const login = async (email: string, password?: string) => {
    setError(null);
    if (!auth) throw new Error("Firebase not configured");
    if (!password) {
      setError("Password is required.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      if (msg) setError(msg);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
      setError(null);
      if (!auth) return;
      try {
          await signInWithPopup(auth, googleProvider);
      } catch (err: any) {
          const msg = getFriendlyErrorMessage(err);
          if (msg) setError(msg);
          throw err;
      }
  };

  const signup = async (email: string, password?: string) => {
    setError(null);
    if (!auth) throw new Error("Firebase not configured");
    if (!password) {
        setError("Password is required.");
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
        const msg = getFriendlyErrorMessage(err);
        if (msg) setError(msg);
        throw err;
    }
  };
  
  const logout = async () => {
    if (auth) {
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Sign out error", e);
        }
    }
    setUser({ plan: 'Free', isGuest: true });
    setError(null);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!auth) throw new Error("Firebase not configured");
    if (!email) {
        setError("Email is required.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
        const msg = getFriendlyErrorMessage(err);
        if (msg) setError(msg);
        throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, resetPassword, error, clearError, isLoading }}>
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