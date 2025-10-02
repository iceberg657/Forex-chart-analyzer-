
import React, { createContext, useContext, ReactNode } from 'react';

export type AppEnvironment = 'website' | 'pwa' | 'aistudio';

export const detectEnvironment = (): AppEnvironment => {
    // The most reliable signal for the AI Studio environment is the presence of an
    // API_KEY injected via environment variables. This avoids false positives
    // from other iframe-based environments like development servers.
    // We check for `process` to avoid ReferenceErrors in browser environments without a polyfill.
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return 'aistudio';
    }

    if (typeof window === 'undefined') {
        // Server-side rendering or non-browser environment
        return 'website';
    }

    // Check for PWA running in standalone mode on the client-side
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'pwa';
    }

    // Default to a standard website environment if no other conditions are met
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
