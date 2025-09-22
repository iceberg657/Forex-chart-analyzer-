import React, { ReactNode } from 'react';

interface ResponsiveFixProps {
  children: ReactNode;
}

const ResponsiveFix: React.FC<ResponsiveFixProps> = ({ children }) => {
  return (
    <div className="app-container">
      {children}
    </div>
  );
};

export default ResponsiveFix;
