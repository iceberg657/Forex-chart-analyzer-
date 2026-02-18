
import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isDashboard = location.pathname === '/dashboard';
  const isLanding = location.pathname === '/';
  const isCharting = location.pathname === '/charting';
  
  // Show back button if user is NOT on the primary dashboard/landing
  const showBack = !isLanding && !isDashboard;

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/analysis') return 'Analysis Result';
    if (path === '/market-news') return 'Market News';
    if (path === '/predictor') return 'AI Event Predictor';
    if (path === '/journal') return 'Trading Journal';
    if (path === '/history') return 'Analysis History';
    if (path === '/apex-ai') return 'Apex AI Assistant';
    if (path === '/coders') return 'AI Coders Hub';
    return '';
  }, [location.pathname]);

  const navLinkClassName = "px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer";
  
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (location.key === 'default') {
      navigate('/dashboard');
    } else {
      navigate(-1);
    }
  };

  const guestLinks = (isMobile = false) => {
    const mobileClass = isMobile ? 'block' : '';
    return (
        <>
            <Link 
              to="/#features" 
              onClick={(e) => {
                setIsOpen(false);
                if (isLanding) {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }
              }} 
              className={`${navLinkClassName} ${mobileClass}`}
            >
              Features
            </Link>
            <Link to="/login" onClick={() => setIsOpen(false)} className={`${navLinkClassName} ${mobileClass}`}>Login</Link>
            <Link to="/signup" onClick={() => setIsOpen(false)} className={`${navLinkClassName} ${mobileClass}`}>Sign Up</Link>
        </>
    );
  };

  return (
    <header className={`bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300 transform-gpu glass-fix ${isCharting ? 'h-10' : 'h-16'}`}>
      {/* Horizontal Line Fix: Subtle shadow ring instead of 1px border div */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-black/5 dark:bg-white/10"></div>
      
      <div className="w-full h-full px-4">
        <div className="flex items-center justify-between h-full relative">
          
          {/* Left: Back Button or Logo */}
          <div className="flex-shrink-0 flex items-center z-[60] min-w-[100px]">
            {showBack ? (
                <button 
                  onClick={handleBack}
                  type="button"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg bg-gray-500/5 hover:bg-gray-500/10 ring-1 ring-transparent hover:ring-gray-500/20 active:scale-95 cursor-pointer"
                >
                    <i className="fas fa-chevron-left text-xs"></i>
                    <span className="font-bold text-xs uppercase">Back</span>
                </button>
            ) : (
                <Logo />
            )}
          </div>

          {/* Center: Title (Only on subpages) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             {pageTitle && !isLanding && (
               <h1 className="text-gray-900 dark:text-white font-bold text-sm sm:text-base tracking-tight uppercase">
                 {pageTitle}
               </h1>
             )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-2 z-[60]">
            <ThemeToggle />
            {!user.isGuest ? (
               <button onClick={logout} className={`${navLinkClassName} whitespace-nowrap`}>Logout</button>
            ) : !isCharting && !isLanding && (
               <div className="hidden md:flex space-x-4">
                 {guestLinks()}
               </div>
            )}

            {/* Mobile Menu Toggle for Guest */}
            {user.isGuest && !isCharting && (
               <button
                  onClick={() => setIsOpen(!isOpen)}
                  type="button"
                  className="md:hidden ml-2 bg-gray-500/10 inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none"
              >
                  <svg className={`${isOpen ? 'hidden' : 'block'} h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg className={`${isOpen ? 'block' : 'hidden'} h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      {isOpen && user.isGuest && !isCharting && (
        <div className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl ring-b ring-white/20 dark:ring-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {guestLinks(true)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
