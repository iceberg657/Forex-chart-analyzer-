import React from 'react';
import { useEnvironment } from '../hooks/useEnvironment';

const EnvironmentBadge: React.FC = () => {
    const env = useEnvironment();
    let text: string;
    let icon: string;

    switch(env) {
        case 'pwa':
            text = 'PWA Mode';
            icon = 'fas fa-download';
            break;
        case 'aistudio':
            text = 'AI Studio';
            icon = 'fas fa-cogs';
            break;
        case 'website':
        default:
            text = 'Web Mode';
            icon = 'fas fa-globe';
            break;
    }

    return (
        <div className="absolute bottom-2 right-2 text-xs bg-black/10 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full flex items-center gap-1.5" title={`Running in ${text}`}>
            <i className={icon}></i>
            <span className="hidden sm:inline">{text}</span>
        </div>
    );
};


const Footer: React.FC = () => {
  return (
    <footer className="relative bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg border-t border-white/20 dark:border-white/10">
      <div className="py-4 text-center text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} Grey Algo Apex Trader. All rights reserved.</p>
        <p className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Our Platforms</p>
        <div className="flex justify-center space-x-6 mt-2">
          <a href="https://greyalgo-trading.netlify.app" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">
            Grey Algo Trading
          </a>
          <a href="https://quant-systems-trading.netlify.app" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">
            Quant Systems Trading
          </a>
        </div>
      </div>
      <EnvironmentBadge />
    </footer>
  );
};

export default Footer;