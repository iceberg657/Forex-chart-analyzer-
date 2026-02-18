import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type EdgeLightColor = 'default' | 'green' | 'red' | 'orange' | 'yellow' | 'blue' | 'purple' | 'white' | 'pink';

const ALL_EDGE_LIGHT_CLASSES = [
  'edge-light-green', 
  'edge-light-red', 
  'edge-light-orange', 
  'edge-light-yellow', 
  'edge-light-blue', 
  'edge-light-purple', 
  'edge-light-white',
  'edge-light-pink'
];


interface EdgeLightingContextType {
  setEdgeLight: (color: EdgeLightColor) => void;
}

const EdgeLightingContext = createContext<EdgeLightingContextType | undefined>(undefined);

export const EdgeLightingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [edgeLight, setEdgeLight] = useState<EdgeLightColor>('default');

  useEffect(() => {
    document.body.classList.remove(...ALL_EDGE_LIGHT_CLASSES);
    if (edgeLight !== 'default') {
      document.body.classList.add(`edge-light-${edgeLight}`);
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