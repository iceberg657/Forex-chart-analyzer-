
import React, { createContext, useContext, ReactNode } from 'react';

export type AppEnvironment = 'website' | 'pwa' | 'aistudio';

export const detectEnvironment = (): AppEnvironment => {
    if (typeof window === 'undefined') return 'website';

    // Check for PWA running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'pwa';
    }
    
    // Check for running inside an iframe (like AI Studio)
    try {
        if (window.self !== window.top) {
            return 'aistudio';
        }
    } catch (e) {
        // A SecurityError is thrown in cross-origin iframes, which is a strong indicator.
        return 'aistudio';
    }

    // Default to a standard website environment
    return 'website';
};

const EnvironmentContext = createContext<AppEnvironment>('website');

export const EnvironmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Detect the environment once and provide it to the entire app.
    const environment = detectEnvironment();
    return (
        <EnvironmentContext.Provider value={environment}>
            {children}
        </EnvironmentContext.Provider>
    );
};

export const useEnvironment = (): AppEnvironment => {
  return useContext(EnvironmentContext);
};
