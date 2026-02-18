
import React from 'react';
import { NavLink } from '../hooks/useAppContext';

interface NavItem {
    to: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie' },
    { to: '/charting', label: 'Charts', icon: 'fas fa-chart-bar' },
    { to: '/apex-ai', label: 'Apex AI', icon: 'fas fa-robot' },
    { to: '/history', label: 'History', icon: 'fas fa-history' },
    { to: '/predictor', label: 'Predictor', icon: 'fas fa-bolt' },
    { to: '/coders', label: 'AI Coders', icon: 'fas fa-code' },
];

const TabbedNav: React.FC = () => {
    const activeClassName = "bg-red-600/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 ring-1 ring-red-500/50";
    const inactiveClassName = "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 ring-1 ring-transparent";

    return (
        <nav className="bg-white/95 dark:bg-[#0C0F1A] sticky top-16 z-40 transform-gpu glass-fix">
            {/* Horizontal Line Fix: Subtle ring shadow instead of border */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-black/5 dark:bg-white/5"></div>
            
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 p-2 overflow-x-auto no-scrollbar">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }: { isActive: boolean }) => 
                                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? activeClassName : inactiveClassName}`
                            }
                        >
                            <i className={item.icon}></i>
                            <span className="hidden sm:inline">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </nav>
    );
};

export default TabbedNav;
