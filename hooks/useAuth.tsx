
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
          plan: 'Free', // Default plan, in a real app this would come from a DB
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
    console.error("Auth Error:", err.code, err.message);
    switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return "Invalid email or password.";
        case 'auth/email-already-in-use':
            return "That email is already in use.";
        case 'auth/weak-password':
            return "Password should be at least 6 characters.";
        case 'auth/popup-closed-by-user':
            return null; // Don't show error for voluntary close
        case 'auth/cancelled-popup-request':
            return null; // Multiple popups
        case 'auth/operation-not-allowed':
            return "Google Sign-In is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.";
        case 'auth/unauthorized-domain':
            return "This domain is not authorized. Add it to Firebase Console > Authentication > Settings > Authorized domains.";
        case 'auth/popup-blocked':
            return "Sign-in popup was blocked. Please allow popups for this site.";
        case 'auth/invalid-email':
            return "Please enter a valid email address.";
        case 'auth/missing-email':
             return "Email is required.";
        default:
            return err.message || "Authentication failed.";
    }
  };

  const login = async (email: string, password?: string) => {
    setError(null);
    if (!auth) {
        setError("Firebase not configured.");
        throw new Error("Firebase not configured");
    }
    if (!password) {
      setError("Password is required.");
      throw new Error("Password is required");
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
      if (!auth) {
          setError("Firebase not configured. Please add VITE_FIREBASE keys to .env");
          return;
      }
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
    if (!auth) {
        setError("Firebase not configured.");
        throw new Error("Firebase not configured");
    }
    if (!password) {
        setError("Password is required.");
        throw new Error("Password is required");
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
        await signOut(auth);
    }
    setUser({ plan: 'Free', isGuest: true });
    setError(null);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!auth) {
        setError("Firebase not configured.");
        throw new Error("Firebase not configured");
    }
    if (!email) {
        setError("Email is required.");
        throw new Error("Email is required");
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
