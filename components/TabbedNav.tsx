
import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
    to: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie' },
    { to: '/charting', label: 'Charts', icon: 'fas fa-chart-bar' },
    { to: '/apex-ai', label: 'Apex AI', icon: 'fas fa-robot' },
    { to: '/journal', label: 'Journal', icon: 'fas fa-book' },
    { to: '/history', label: 'History', icon: 'fas fa-history' },
    { to: '/coders', label: 'AI Coders', icon: 'fas fa-code' },
    { to: '/market-news', label: 'Market News', icon: 'fas fa-newspaper' },
    { to: '/predictor', label: 'Predictor', icon: 'fas fa-bolt' },
];

const TabbedNav: React.FC = () => {
    const activeClassName = "bg-red-600/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50";
    const inactiveClassName = "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 border-transparent";

    return (
        <nav className="bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg sticky top-16 z-40 border-b border-white/20 dark:border-white/10 shadow-sm">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 p-2 overflow-x-auto">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => 
                                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${isActive ? activeClassName : inactiveClassName}`
                            }
                        >
                            <i className={item.icon}></i>
                            <span className="hidden sm:inline">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default TabbedNav;
