import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };
  
  const navLinkClassName = "px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10";
  const activeClassName = "bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-600";
  
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => `${navLinkClassName} ${isActive ? activeClassName : ''}`;

  return (
    <header className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg shadow-md sticky top-0 z-50 border-b border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between h-16">
        <div className="flex-shrink-0">
          <Logo />
        </div>
        <div className="hidden md:block">
          <div className="ml-10 flex items-center space-x-4">
            <NavLink to="/" className={getNavLinkClass} end>Chart Analysis</NavLink>
            <NavLink to="/introduction" className={getNavLinkClass}>AI Coders</NavLink>
            <NavLink to="/pricing" className={getNavLinkClass}>Pricing</NavLink>
            {user.isGuest ? (
              <>
                <NavLink to="/login" className={getNavLinkClass}>Login</NavLink>
                <NavLink to="/signup" className={getNavLinkClass}>Sign Up</NavLink>
              </>
            ) : (
              <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10">Logout</button>
            )}
            <ThemeToggle />
          </div>
        </div>
        <div className="-mr-2 flex md:hidden items-center">
           <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="ml-2 bg-gray-500/10 inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-white"
          >
            <span className="sr-only">Open main menu</span>
            <svg className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <NavLink to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10">Chart Analysis</NavLink>
              <NavLink to="/introduction" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10">AI Coders</NavLink>
              <NavLink to="/pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10">Pricing</NavLink>
              {user.isGuest ? (
                <>
                  <NavLink to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10">Login</NavLink>
                  <NavLink to="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10">Sign Up</NavLink>
                </>
              ) : (
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10">Logout</button>
              )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
