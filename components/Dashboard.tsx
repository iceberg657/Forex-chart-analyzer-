import React, { useEffect, useState } from 'react';
import { getDashboardOverview } from '../services/dashboardService';
import { DashboardOverview, ActivityItem, HeatmapAsset, GroundingSource } from '../types';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import { usePageData } from '../hooks/usePageData';
import SeasonalModeToggle from './SeasonalModeToggle';

type HeatmapMode = 'performance' | 'volume' | 'technical' | 'reversion';

const safeArray = (val: any): any[] => Array.isArray(val) ? val : [];

const SectionHeader: React.FC<{ icon: string; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
    <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
            <i className={`${icon} text-red-500`}></i>
            <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">{title}</h3>
        </div>
        {subtitle && (
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{subtitle}</span>
        )}
    </div>
);

const ActivityFeedItem: React.FC<{ item: ActivityItem }> = ({ item }) => {
    const icons = {
        news: 'fa-globe-americas text-blue-400',
        alert: 'fa-bell text-yellow-400',
        calendar: 'fa-calendar-clock text-red-400'
    };
    
    return (
        <div className="group flex gap-4 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5 last:border-0">
            <div className="flex-shrink-0 mt-1">
                <i className={`fas ${icons[item.type] || icons.news} text-sm`}></i>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="text-[11px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">{item.title}</h4>
                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">{item.time}</span>
                </div>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{item.content}</p>
                {item.asset && (
                    <span className="inline-block mt-2 text-[8px] font-black text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded uppercase tracking-widest">{item.asset}</span>
                )}
            </div>
        </div>
    );
};

const OpportunityFinder: React.FC<{ assets: HeatmapAsset[] }> = ({ assets }) => {
    const [mode, setMode] = useState<HeatmapMode>('performance');

    const getBoxStyle = (asset: HeatmapAsset) => {
        let size = '100%';
        let bgColor = 'bg-gray-800';

        if (mode === 'volume') {
            const scale = Math.min(Math.max(asset.volumeRatio || 1, 0.5), 2);
            size = `${scale * 100}%`;
        }

        // Color Logic
        if (mode === 'technical') {
            if (asset.rsi < 30) bgColor = 'bg-blue-600'; // Oversold
            else if (asset.rsi > 70) bgColor = 'bg-orange-600'; // Overbought
            else bgColor = 'bg-gray-700';
        } else if (mode === 'reversion') {
            if (asset.zScore > 2) bgColor = 'bg-red-900';
            else if (asset.zScore < -2) bgColor = 'bg-green-900';
            else bgColor = 'bg-gray-700';
        } else {
            bgColor = (asset.change24h || 0) >= 0 ? 'bg-emerald-900/60' : 'bg-rose-900/60';
        }

        return { size, bgColor };
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2 px-1">
                {(['performance', 'volume', 'technical', 'reversion'] as HeatmapMode[]).map(m => (
                    <button 
                        key={m}
                        onClick={() => setMode(m)}
                        className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-all ${mode === m ? 'bg-red-600 border-red-500 text-white' : 'bg-white/40 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        {m === 'reversion' ? 'Z-Score' : m}
                    </button>
                ))}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-[280px]">
                {safeArray(assets).slice(0, 12).map((asset, i) => {
                    const { size, bgColor } = getBoxStyle(asset);
                    const change = asset.change24h || 0;
                    return (
                        <div key={i} className="relative group overflow-hidden rounded-xl border border-white/5 flex items-center justify-center bg-black/80 dark:bg-black/40">
                            <div 
                                className={`absolute transition-all duration-700 rounded-lg ${bgColor}`}
                                style={{ width: size, height: size, opacity: 0.4 }}
                            ></div>
                            <div className="relative z-10 text-center p-2">
                                <span className="block text-xs font-black text-white mb-0.5">{asset.symbol}</span>
                                <span className={`text-[10px] font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {change >= 0 ? '+' : ''}{change}%
                                </span>
                                <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-black/90 backdrop-blur-xl p-2 rounded-lg border border-white/20 text-[8px] font-bold space-y-1 shadow-2xl z-50">
                                    <div className="flex justify-between text-gray-300"><span>RSI:</span> <span className={asset.rsi > 70 ? 'text-orange-400' : asset.rsi < 30 ? 'text-blue-400' : 'text-white'}>{asset.rsi || 'N/A'}</span></div>
                                    <div className="flex justify-between text-gray-300"><span>Volume:</span> <span>{asset.volumeRatio || 1}x</span></div>
                                    <div className="flex justify-between text-gray-300"><span>Z-Score:</span> <span>{asset.zScore || 0}</span></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { pageData, setDashboardData, isSeasonalModeActive } = usePageData();
    const { overview, error } = pageData.dashboard;
    const [isLoading, setIsLoading] = useState(!overview);

    const fetchDashboard = async () => {
        setIsLoading(true);
        try {
            const data = await getDashboardOverview(isSeasonalModeActive);
            setDashboardData({ overview: data, error: null });
        } catch (err: any) {
            setDashboardData({ overview: overview, error: err.message || 'Neural Link Error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Hourly update logic: Only fetch if data is missing or older than 1 hour (3600000 ms)
        const isDataFresh = overview && overview.lastUpdated && (Date.now() - overview.lastUpdated < 3600000);
        
        if (!isDataFresh) {
            fetchDashboard();
        } else {
            setIsLoading(false);
        }
    }, [isSeasonalModeActive]);

    if (isLoading && !overview) return <div className="py-24 flex justify-center"><Spinner /></div>;

    return (
        <div className="space-y-6 pb-10 px-4 max-w-7xl mx-auto glass-fix">
            {/* Top Command Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-cyan-400 uppercase tracking-tighter">Terminal Dashboard</h1>
                    {overview?.nextBigEvent && (
                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1 animate-pulse">
                            <i className="fas fa-bolt mr-1"></i> Critical: {overview.nextBigEvent.title} in {overview.nextBigEvent.timeUntil}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={fetchDashboard} disabled={isLoading} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-blue-500 dark:text-blue-400 transition-all">
                        <i className={`fas fa-sync ${isLoading ? 'animate-spin' : ''}`}></i>
                    </button>
                    <div className="h-8 w-px bg-black/10 dark:bg-white/10"></div>
                    <SeasonalModeToggle />
                </div>
            </div>

            {error && <ErrorDisplay error={error} />}

            {overview && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 glass-fix">
                    
                    {/* FEED & WATCHLIST ROW */}
                    <div className="lg:col-span-8 bg-white/60 dark:bg-black/60 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 rounded-[2rem] shadow-xl overflow-hidden glass-fix flex flex-col h-[500px]">
                        <div className="p-6 pb-2 border-b border-black/5 dark:border-white/5">
                            <SectionHeader icon="fas fa-stream" title="Smart Activity Feed" subtitle="INSTITUTIONAL INTEL" />
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {safeArray(overview.activityFeed).map((item, i) => (
                                <ActivityFeedItem key={i} item={item} />
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-4 bg-white/60 dark:bg-black/60 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 rounded-[2rem] shadow-xl p-6 glass-fix flex flex-col h-[500px]">
                        <SectionHeader icon="fas fa-list-ul" title="Dynamic Watchlist" />
                        <div className="flex-1 space-y-1 mt-2">
                            {safeArray(overview.watchlist).map((item, i) => {
                                const changeRaw = item.change24h;
                                let changeDisplay: string;
                                let isNegative: boolean;

                                if (typeof changeRaw === 'number') {
                                    changeDisplay = `${changeRaw > 0 ? '+' : ''}${changeRaw.toFixed(2)}%`;
                                    isNegative = changeRaw < 0;
                                } else {
                                    changeDisplay = String(changeRaw || '0.00%');
                                    isNegative = changeDisplay.includes('-');
                                }
                                
                                return (
                                    <div key={i} className="flex justify-between items-center p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all border-b border-black/5 dark:border-white/5 last:border-0">
                                        <div>
                                            <span className="block text-xs font-black text-gray-900 dark:text-white">{item.symbol}</span>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{item.price || '---'}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-md ${isNegative ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                                                {changeDisplay}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                             <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                                <span className="block text-[8px] font-black text-blue-500 dark:text-blue-400 uppercase mb-1">Market Sentiment Index</span>
                                <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '68%' }}></div>
                                </div>
                                <div className="flex justify-between mt-1 text-[8px] font-black text-gray-500 uppercase">
                                    <span>Bearish</span>
                                    <span className="text-blue-600 dark:text-blue-400">68% Bullish</span>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* HEATMAPS ROW */}
                    <div className="lg:col-span-4 bg-white/60 dark:bg-black/60 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 rounded-[2rem] shadow-xl p-6 glass-fix h-[420px]">
                        <SectionHeader icon="fas fa-fire" title="Sector Heatmap" />
                        <div className="grid grid-cols-1 gap-3 mt-4">
                            {safeArray(overview.sectorHeatmap).map((sector, i) => (
                                <div key={i} className="relative h-12 rounded-xl overflow-hidden bg-gray-200 dark:bg-white/5 border border-black/5 dark:border-white/5 group">
                                    <div 
                                        className={`absolute inset-y-0 left-0 transition-all duration-1000 ${sector.status === 'hot' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}
                                        style={{ width: `${sector.strength || 0}%` }}
                                    ></div>
                                    <div className="relative z-10 h-full flex justify-between items-center px-4">
                                        <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{sector.sector}</span>
                                        <span className={`text-[9px] font-black uppercase ${sector.status === 'hot' ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {sector.status === 'hot' ? 'High Volume' : 'Ranging'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 bg-white/60 dark:bg-black/60 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 rounded-[2rem] shadow-xl p-6 glass-fix h-[420px]">
                        <SectionHeader icon="fas fa-project-diagram" title="The Opportunity Finder" subtitle="MULTI-DIMENSIONAL HEATMAP" />
                        <OpportunityFinder assets={overview.opportunityHeatmap} />
                    </div>

                </div>
            )}
            
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};

export default Dashboard;