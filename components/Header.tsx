import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const navLinkClassName = "px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10";
  
  const guestLinks = (isMobile = false) => {
    const mobileClass = isMobile ? 'block' : '';
    // Note: Kept as `a` tags for same-page scrolling on landing page.
    return (
        <>
            <a href="#features" onClick={() => setIsOpen(false)} className={`${navLinkClassName} ${mobileClass}`}>Features</a>
            <a href="#pricing" onClick={() => setIsOpen(false)} className={`${navLinkClassName} ${mobileClass}`}>Pricing</a>
            <Link to="/login" onClick={() => setIsOpen(false)} className={`${navLinkClassName} ${mobileClass}`}>Login</Link>
            <Link to="/signup" onClick={() => setIsOpen(false)} className={`${navLinkClassName} ${mobileClass}`}>Sign Up</Link>
        </>
    );
  };

  return (
    <header className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg shadow-md sticky top-0 z-50 border-b border-white/20 dark:border-white/10">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {user.isGuest ? (
                guestLinks()
              ) : (
                <button onClick={logout} className={navLinkClassName}>Logout</button>
              )}
              <ThemeToggle />
            </div>
          </div>
          <div className="-mr-2 flex md:hidden items-center">
            <ThemeToggle />
            {user.isGuest && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="ml-2 bg-gray-500/10 inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <svg className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {!user.isGuest && (
              <button onClick={logout} className={`${navLinkClassName} ml-2`}>Logout</button>
            )}
          </div>
        </div>
      </div>
      {isOpen && user.isGuest && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {guestLinks(true)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;