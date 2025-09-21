import React from 'react';
import { NavLink } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <NavLink to="/" className="flex items-center space-x-2" end>
      <svg
        width="36"
        height="36"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Grey Algo Apex Trader Logo"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--logo-color-1)' }} />
            <stop offset="33%" style={{ stopColor: 'var(--logo-color-2)' }} />
            <stop offset="66%" style={{ stopColor: 'var(--logo-color-3)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--logo-color-4)' }} />
          </linearGradient>
        </defs>
        <path d="M50 2.5 L95.5 26.25 V 73.75 L50 97.5 L4.5 73.75 V 26.25 Z" stroke="url(#logoGradient)" strokeWidth="5" />
        <text x="50" y="68" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="bold" fill="url(#logoGradient)" textAnchor="middle" >GA</text>
        <path d="M25 70 L40 60 L55 75 L75 55" stroke="url(#logoGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="self-center text-xl font-bold whitespace-nowrap">
        <span className="text-gray-900 dark:text-white">Grey Algo</span>
        {' '}
        <span className="animated-gradient-text">Apex</span>
        {' '}
        <span className="text-gray-900 dark:text-white">Trader</span>
      </span>
    </NavLink>
  );
};

export default Logo;
