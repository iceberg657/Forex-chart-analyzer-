

import React, { createContext, useContext, ReactNode } from 'react';

export type AppEnvironment = 'website' | 'pwa' | 'aistudio';

export const detectEnvironment = (): AppEnvironment => {
    if (typeof window === 'undefined') {
        // Server-side rendering or non-browser environment
        return 'website';
    }

    // AI Studio provides a global `service` object on the window. This is the most reliable check.
    if (window.service && typeof window.service.gemini?.generateContent === 'function') {
        return 'aistudio';
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