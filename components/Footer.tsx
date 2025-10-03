import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg border-t border-white/20 dark:border-white/10">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </div>
    </footer>
  );
};

export default Footer;