import React from 'react';

const GALogoIcon: React.FC<{ size?: string }> = ({ size = "2rem" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="logoGradientTyping" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--logo-color-1)' }} />
                <stop offset="33%" style={{ stopColor: 'var(--logo-color-2)' }} />
                <stop offset="66%" style={{ stopColor: 'var(--logo-color-3)' }} />
                <stop offset="100%" style={{ stopColor: 'var(--logo-color-4)' }} />
            </linearGradient>
        </defs>
        <path d="M50 2.5 L95.5 26.25 V 73.75 L50 97.5 L4.5 73.75 V 26.25 Z" stroke="url(#logoGradientTyping)" strokeWidth="8" />
        <text x="50" y="68" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="bold" fill="url(#logoGradientTyping)" textAnchor="middle" >GA</text>
    </svg>
);

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-transparent">
        <GALogoIcon />
      </div>
      <div className="max-w-xl p-3 rounded-xl bg-gray-200 dark:bg-[#262626] rounded-bl-none">
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;