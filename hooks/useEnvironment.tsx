import React, { createContext, useContext, ReactNode } from 'react';

export type AppEnvironment = 'website' | 'pwa' | 'aistudio';

export const detectEnvironment = (): AppEnvironment => {
    if (typeof window === 'undefined') {
        // Server-side rendering or non-browser environment
        return 'website';
    }

    // The presence of a client-side API_KEY is the definitive check for the AI Studio environment.
    // This allows for direct API calls without a backend proxy.
    // We must safely check for 'process' to avoid ReferenceErrors in standard browser environments.
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return 'aistudio';
        }
    } catch (e) {
        // process is not defined, ignore and proceed
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