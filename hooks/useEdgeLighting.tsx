import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type EdgeLightColor = 'default' | 'green' | 'red';

interface EdgeLightingContextType {
  setEdgeLight: (color: EdgeLightColor) => void;
}

const EdgeLightingContext = createContext<EdgeLightingContextType | undefined>(undefined);

export const EdgeLightingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [edgeLight, setEdgeLight] = useState<EdgeLightColor>('default');

  useEffect(() => {
    document.body.classList.remove('edge-light-green', 'edge-light-red');
    if (edgeLight === 'green') {
      document.body.classList.add('edge-light-green');
    } else if (edgeLight === 'red') {
      document.body.classList.add('edge-light-red');
    }
  }, [edgeLight]);

  return (
    <EdgeLightingContext.Provider value={{ setEdgeLight }}>
      {children}
    </EdgeLightingContext.Provider>
  );
};

export const useEdgeLighting = (): EdgeLightingContextType => {
  const context = useContext(EdgeLightingContext);
  if (context === undefined) {
    throw new Error('useEdgeLighting must be used within an EdgeLightingProvider');
  }
  return context;
};
