import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface ApiStatusContextType {
  apiKey: string | null;
  isApiConfigured: boolean;
  setApiKey: (key: string) => void;
}

const ApiStatusContext = createContext<ApiStatusContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = 'gemini-api-key';

export const ApiStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Priority: 1. Environment variable, 2. Local storage
    const envKey = process.env.API_KEY;
    if (envKey) {
      setApiKeyState(envKey);
    } else {
      try {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (storedKey) {
          setApiKeyState(storedKey);
        }
      } catch (e) {
        console.error("Could not access local storage:", e);
      }
    }
    setIsInitialized(true);
  }, []);

  const setApiKey = (key: string) => {
    if (key) {
      try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
        setApiKeyState(key);
      } catch (e) {
        console.error("Could not set item in local storage:", e);
      }
    }
  };

  const isApiConfigured = !!apiKey;

  const value = {
      apiKey,
      isApiConfigured,
      setApiKey
  };

  if (!isInitialized) {
      return null; // Render nothing until hydration from localStorage is complete
  }

  return (
    <ApiStatusContext.Provider value={value}>
      {children}
    </ApiStatusContext.Provider>
  );
};

export const useApiStatus = (): ApiStatusContextType => {
  const context = useContext(ApiStatusContext);
  if (context === undefined) {
    throw new Error('useApiStatus must be used within an ApiStatusProvider');
  }
  return context;
};