import React, { useState, useEffect } from 'react';
import { getSessionFilter } from '../services/unifiedApiService';
import { SessionFilterResult } from '../types';

const SessionFilter: React.FC = () => {
    const [filterData, setFilterData] = useState<SessionFilterResult | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSessionFilter();
            setFilterData(data);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to load session filter data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Reset every 1 hour (3600000 ms)
        const interval = setInterval(() => {
            fetchData();
        }, 3600000);
        return () => clearInterval(interval);
    }, []);

    const getSessionColor = (session: string) => {
        switch (session) {
            case 'London': return 'text-blue-500';
            case 'New York': return 'text-green-500';
            case 'Asian': return 'text-orange-500';
            case 'Overlap': return 'text-purple-500';
            default: return 'text-gray-500';
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'High': return 'bg-red-500/20 text-red-500 border-red-500/30';
            case 'Medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'Low': return 'bg-green-500/20 text-green-500 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Session Filter</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Real-time market conditions and opportunities for the current trading session.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {lastUpdated && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            <i className={`fas fa-sync-alt w-4 h-4 ${loading ? 'animate-spin' : ''}`}></i>
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-start gap-3">
                        <i className="fas fa-exclamation-circle w-5 h-5 flex-shrink-0 mt-0.5"></i>
                        <p>{error}</p>
                    </div>
                )}

                {loading && !filterData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 bg-gray-200 dark:bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                ) : filterData ? (
                    <div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* Current Session */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex items-center gap-6">
                            <div className="p-4 bg-blue-500/10 rounded-full">
                                <i className={`fas fa-clock w-8 h-8 ${getSessionColor(filterData.currentSession)}`}></i>
                            </div>
                            <div>
                                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Session</h2>
                                <p className={`text-3xl font-bold ${getSessionColor(filterData.currentSession)}`}>
                                    {filterData.currentSession}
                                </p>
                            </div>
                        </div>

                        {/* Major Economic Events */}
                        <div className="col-span-1 md:col-span-2 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <i className="fas fa-calendar-alt w-5 h-5 text-blue-500"></i>
                                <h3 className="text-lg font-semibold">Major Economic Events</h3>
                            </div>
                            <div className="space-y-4">
                                {filterData.majorEvents.length > 0 ? (
                                    filterData.majorEvents.map((event, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                            <div>
                                                <p className="font-medium">{event.event}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{event.time}</p>
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getImpactColor(event.impact)}`}>
                                                {event.impact} Impact
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No major events scheduled for this session.</p>
                                )}
                            </div>
                        </div>

                        {/* Desired Assets */}
                        <div className="col-span-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <i className="fas fa-bullseye w-5 h-5 text-emerald-500"></i>
                                <h3 className="text-lg font-semibold">Desired Assets to Trade</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {filterData.desiredAssets.map((asset, idx) => (
                                    <span key={idx} className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl font-medium">
                                        {asset}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Affected Pairs */}
                        <div className="col-span-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <i className="fas fa-chart-line w-5 h-5 text-purple-500"></i>
                                <h3 className="text-lg font-semibold">Affected Pairs & Assets</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {filterData.affectedPairs.map((pair, idx) => (
                                    <span key={idx} className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm">
                                        {pair}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Volatile Pairs */}
                        <div className="col-span-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <i className="fas fa-bolt w-5 h-5 text-orange-500"></i>
                                <h3 className="text-lg font-semibold">Volatile Pairs</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {filterData.volatilePairs.map((pair, idx) => (
                                    <span key={idx} className="px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-lg text-sm font-medium">
                                        {pair}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Bullish & Bearish */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <i className="fas fa-arrow-trend-up w-5 h-5 text-green-500"></i>
                                    <h3 className="text-lg font-semibold">Bullish Pairs</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {filterData.bullishPairs.map((pair, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-lg text-sm font-medium">
                                            {pair}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <i className="fas fa-arrow-trend-down w-5 h-5 text-red-500"></i>
                                    <h3 className="text-lg font-semibold">Bearish Pairs</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {filterData.bearishPairs.map((pair, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg text-sm font-medium">
                                            {pair}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default SessionFilter;
