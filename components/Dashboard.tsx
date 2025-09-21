import React, { useState, useEffect } from 'react';

// This component is a static visual representation based on the provided HTML.
// It uses TailwindCSS for styling and includes hardcoded data for demonstration.

const StatCard: React.FC<{ icon: string, title: string, value: string, change?: string, changeType: 'positive' | 'negative', pulseOverride?: 'red' | 'green' | 'none' }> = ({ icon, title, value, change, changeType, pulseOverride }) => (
  <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 sm:p-6 transition-transform hover:-translate-y-1 text-gray-800 dark:text-white">
    <div className="flex justify-between items-center mb-4">
      <div className="text-sm text-gray-600 dark:text-slate-400">{title}</div>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-500/10 text-sky-400">
        <i className={icon}></i>
      </div>
    </div>
    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-50 mb-1">{value}</div>
    <div className={`flex items-center gap-1 text-sm ${changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
      {(() => {
        if (pulseOverride === 'green') return <span className="pulse"></span>;
        if (pulseOverride === 'red') return <span className="pulse-red"></span>;
        if (pulseOverride === 'none') return null;
        if (changeType === 'positive') return <span className="pulse"></span>;
        if (changeType === 'negative') return <i className="fas fa-caret-down"></i>;
        return null;
      })()}
      {change && <span>{change}</span>}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [isWeekend, setIsWeekend] = useState(false);
  const [dayName, setDayName] = useState('');

  useEffect(() => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday, 6 is Saturday
    setIsWeekend(day === 0 || day === 6);
    setDayName(today.toLocaleString('en-US', { weekday: 'long' }));
  }, []);

  return (
    <section className="mb-12 text-center">
      <h1 className="text-4xl lg:text-5xl font-bold mb-4">
        <span className="animated-gradient-text">Algorithmic</span>
        {' '}
        <span className="text-gray-900 dark:text-white">Trading, Simplified</span>
      </h1>
      <p className="text-lg max-w-3xl mx-auto mb-10 text-gray-600 dark:text-slate-400">
         Advanced chart analysis for institutional-grade trade setups. Maximize your profits with AI-driven strategies.
      </p>

      <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/30 dark:border-white/10 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full z-0">
            <div className="floating-element"></div>
            <div className="floating-element"></div>
        </div>
        
        <div className="relative z-10 text-gray-800 dark:text-slate-200">
            <div className="flex justify-between items-center mb-6">
                <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" className="text-2xl font-bold text-gray-800 dark:text-slate-50 hover:text-red-500 dark:hover:text-red-400 transition-colors">Market Overview</a>
                <div className="hidden sm:flex gap-2 bg-gray-500/10 dark:bg-slate-900/40 p-1 rounded-lg">
                    <button className="px-3 py-1 rounded-md text-sm bg-white dark:bg-slate-700 shadow font-semibold text-gray-800 dark:text-white">1H</button>
                    <button className="px-3 py-1 rounded-md text-sm">1D</button>
                    <button className="px-3 py-1 rounded-md text-sm">1W</button>
                </div>
            </div>

            <div className="h-72 relative">
                <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                     <defs>
                        <linearGradient id="graphGradientDark" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0"/>
                        </linearGradient>
                        <linearGradient id="graphGradientLight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    <path className="graph-path" d="M0,250 C150,200 250,100 400,150 C550,200 650,50 800,100 C900,150 1000,100 1000,150 L1000 300 L0 300 Z" />
                </svg>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 text-left">
                <StatCard icon="fas fa-chart-pie" title="CHARTS ANALYZED" value="103" change="+5 Today" changeType="positive" />
                <StatCard icon="fas fa-calendar-day" title="CURRENT DAY" value={dayName} change="" changeType={isWeekend ? 'negative' : 'positive'} pulseOverride={isWeekend ? 'red' : 'green'} />
                <StatCard icon="fas fa-store" title="MARKET STATUS" value={isWeekend ? 'Inactive' : 'Active'} change={isWeekend ? 'Weekend' : 'Weekdays'} changeType={isWeekend ? 'negative' : 'positive'} pulseOverride={isWeekend ? 'red' : 'green'} />
            </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;