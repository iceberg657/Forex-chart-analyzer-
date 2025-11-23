

import React, { useEffect, useState } from 'react';
import { getDashboardOverview } from '../services/dashboardService';
import { DashboardOverview } from '../types';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import { usePageData } from '../hooks/usePageData';

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
    <div className={`bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6 flex flex-col ${className}`}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">{title}</h2>
        <div className="flex-1 text-gray-700 dark:text-gray-300 text-sm space-y-3">
            {children}
        </div>
    </div>
);

const SentimentBadge: React.FC<{ value: string }> = ({ value }) => {
    let colorClass = "bg-gray-500 text-white";
    if (value === 'Bullish') colorClass = "bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]";
    if (value === 'Bearish') colorClass = "bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]";
    
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colorClass}`}>
            {value}
        </span>
    );
};

const Dashboard: React.FC = () => {
    const { pageData, setDashboardData } = usePageData();
    const { overview, error } = pageData.dashboard;
    const [isLoading, setIsLoading] = useState(!overview);

    const fetchOverview = async () => {
        setIsLoading(true);
        try {
            const data = await getDashboardOverview();
            setDashboardData({ overview: data, error: null });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data.';
            setDashboardData({ overview, error: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!overview) {
            fetchOverview();
        }
        const interval = setInterval(() => {
            fetchOverview();
        }, 3600000); // 1 hour

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="space-y-8 animate-fade-in">
             <div className="text-center">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                    <span className="animated-gradient-text">Global Market</span>
                    {' '}
                    <span className="text-gray-900 dark:text-white">Pulse</span>
                </h1>
                <p className="text-lg max-w-3xl mx-auto text-gray-600 dark:text-slate-400">
                    Real-time AI analysis of global financial markets. Resets hourly.
                </p>
            </div>

            {isLoading && (
                <div className="py-20 flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="mt-4 text-gray-500 dark:text-gray-400 animate-pulse">Gathering real-time intelligence...</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="max-w-2xl mx-auto">
                     <ErrorDisplay error={error} />
                     <button onClick={fetchOverview} className="mt-4 mx-auto block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">Try Again</button>
                </div>
            )}

            {overview && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* 1. Current Market Condition */}
                    <Card title="Current Market Condition" className="md:col-span-1">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">MARKET SENTIMENT:</span>
                                <SentimentBadge value={overview.marketCondition.sentiment} />
                            </div>
                             <div>
                                <span className="font-semibold block mb-1">TRENDING PAIRS:</span>
                                <p className="text-gray-600 dark:text-gray-400 font-mono text-xs p-2 bg-black/5 dark:bg-white/5 rounded border border-gray-200 dark:border-gray-700">
                                    {overview.marketCondition.trendingPairs}
                                </p>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">VOLATILITY LEVEL:</span>
                                <span className={`font-bold ${overview.marketCondition.volatility === 'High' ? 'text-red-500' : overview.marketCondition.volatility === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                                    {overview.marketCondition.volatility}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* 2. Key Economic Data */}
                    <Card title="Key Economic Data" className="md:col-span-1">
                         <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">RECENT ECONOMIC EVENTS</h3>
                            <ul className="space-y-2 mb-4">
                                {overview.economicData.recentEvents.map((e, i) => (
                                    <li key={i} className="text-xs flex justify-between items-start border-l-2 border-gray-400 pl-2">
                                        <span className="font-medium mr-2">{e.event}</span>
                                        <span className="text-gray-500 italic text-right">{e.impact}</span>
                                    </li>
                                ))}
                                {overview.economicData.recentEvents.length === 0 && <li className="text-xs text-gray-500">No recent major events.</li>}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">UPCOMING EVENTS</h3>
                             <ul className="space-y-2">
                                {overview.economicData.upcomingEvents.map((e, i) => (
                                    <li key={i} className="text-xs flex flex-col bg-black/5 dark:bg-white/5 p-2 rounded">
                                        <div className="flex justify-between font-bold">
                                            <span>{e.time}</span>
                                            <span>{e.event}</span>
                                        </div>
                                        <div className="text-gray-500 mt-1">{e.expectedImpact}</div>
                                    </li>
                                ))}
                                {overview.economicData.upcomingEvents.length === 0 && <li className="text-xs text-gray-500">No upcoming major events.</li>}
                            </ul>
                        </div>
                    </Card>

                    {/* 3. Technical Summary */}
                    <Card title="3. Technical Summary" className="md:col-span-1">
                         <div className="mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">DOMINANT TRENDS</h3>
                            <div className="space-y-2">
                                {overview.technicalSummary.dominantTrends.map((t, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-gray-200 dark:border-gray-700 pb-1">
                                        <span className="font-bold font-mono">{t.pair}</span>
                                        <span className={`${t.direction.toLowerCase().includes('up') ? 'text-green-500' : t.direction.toLowerCase().includes('down') ? 'text-red-500' : 'text-gray-500'}`}>{t.direction}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">KEY SUPPORT/RESISTANCE</h3>
                            <ul className="space-y-1">
                                {overview.technicalSummary.keyLevels.map((lvl, i) => (
                                    <li key={i} className="text-xs font-mono text-gray-600 dark:text-gray-400">• {lvl}</li>
                                ))}
                            </ul>
                        </div>
                    </Card>

                    {/* 4. Trading Opportunities */}
                    <Card title="4. Trading Opportunities" className="md:col-span-1">
                         <div className="mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">HIGH PROBABILITY SETUPS</h3>
                            <div className="space-y-2">
                                {overview.tradingOpportunities.highProbabilitySetups.map((setup, i) => (
                                    <div key={i} className="bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between font-bold text-sm">
                                            <span>{setup.pair}</span>
                                            <span className="text-blue-500">{setup.strategy}</span>
                                        </div>
                                        <div className="text-right text-xs mt-1 text-gray-500">
                                            Confidence: <span className="font-bold text-green-500">{setup.confidence}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                             <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">RISK ASSESSMENT</h3>
                             <div className="grid grid-cols-2 gap-4 text-center">
                                 <div className="bg-red-500/10 p-2 rounded">
                                     <p className="text-[10px] text-gray-500">Market Risk</p>
                                     <p className="font-bold text-red-500">{overview.tradingOpportunities.riskAssessment.marketRisk}</p>
                                 </div>
                                 <div className="bg-blue-500/10 p-2 rounded">
                                     <p className="text-[10px] text-gray-500">Rec. Sizing</p>
                                     <p className="font-bold text-blue-500">{overview.tradingOpportunities.riskAssessment.positionSizing}</p>
                                 </div>
                             </div>
                        </div>
                    </Card>

                </div>
            )}
            
            {overview && !isLoading && (
                <div className="text-center text-xs text-gray-400 mt-8">
                    AI Analysis generated at {new Date(overview.lastUpdated).toLocaleTimeString()}
                </div>
            )}
        </section>
    );
};

export default Dashboard;
