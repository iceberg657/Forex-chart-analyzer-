





import React, { useEffect, useState } from 'react';
import { getDashboardOverview } from '../services/dashboardService';
import { DashboardOverview, DailyBias } from '../types';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import { usePageData } from '../hooks/usePageData';
import { useNavigate } from 'react-router-dom';

const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    const height = 40;
    const width = 100;
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const ConfidenceMeter: React.FC<{ value: number }> = ({ value }) => {
    // Value 0-100
    let color = 'bg-red-500';
    if (value > 75) color = 'bg-green-500';
    else if (value > 45) color = 'bg-yellow-500';

    return (
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
            <div 
                className={`h-full ${color} transition-all duration-500`} 
                style={{ width: `${value}%` }}
            ></div>
        </div>
    );
};

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string; icon?: string }> = ({ title, children, className = "", icon }) => (
    <div className={`bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 ${className}`}>
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                {icon && <i className={`${icon} text-red-500`}></i>}
                {title}
            </h2>
        </div>
        <div className="p-4 flex-1">
            {children}
        </div>
    </div>
);

const SentimentBadge: React.FC<{ value: string }> = ({ value }) => {
    let colorClass = "bg-gray-500 text-white";
    if (value === 'Bullish') colorClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800";
    if (value === 'Bearish') colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800";
    
    return (
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${colorClass}`}>
            {value}
        </span>
    );
};

const DailyBiasCard: React.FC<{ biases: DailyBias[] }> = ({ biases }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            triggerTransition();
        }, 60000); // 1 minute
        return () => clearInterval(interval);
    }, [biases.length]);

    const triggerTransition = (nextIndex?: number) => {
        setFade(true);
        setTimeout(() => {
            setCurrentIndex(prev => nextIndex !== undefined ? nextIndex : (prev + 1) % biases.length);
            setFade(false);
        }, 300); // Wait for fade out
    };

    const handleClick = () => {
        triggerTransition();
    };

    if (!biases || biases.length === 0) return null;

    const currentBias = biases[currentIndex];
    const isBullish = currentBias.bias === 'Bullish';
    const isBearish = currentBias.bias === 'Bearish';
    
    // Dynamic styles based on bias
    const gradientClass = isBullish 
        ? "from-green-600 to-emerald-600" 
        : isBearish 
            ? "from-red-600 to-rose-600" 
            : "from-blue-600 to-indigo-600";
            
    const strengthBadgeClass = isBullish 
        ? "bg-green-800/30 text-green-100" 
        : isBearish 
            ? "bg-red-800/30 text-red-100" 
            : "bg-blue-800/30 text-blue-100";

    return (
        <div 
            onClick={handleClick}
            className={`cursor-pointer bg-gradient-to-br ${gradientClass} rounded-xl p-5 text-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col justify-between transition-colors duration-500 ease-in-out hover:shadow-xl hover:scale-[1.01] transform transition-transform`}
        >
            <div className={`transition-opacity duration-300 ${fade ? 'opacity-0' : 'opacity-100'}`}>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                        <i className="fas fa-star text-yellow-300"></i> Daily Bias
                    </h3>
                    <div className="flex gap-1">
                        {biases.map((_, i) => (
                            <div key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/30'}`}></div>
                        ))}
                    </div>
                </div>
                
                <p className="text-white/90 text-sm font-medium leading-relaxed min-h-[3rem]">
                    {currentBias.reasoning}
                </p>

                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
                    <div>
                        <p className="text-xs text-white/70 uppercase font-semibold tracking-wider">Pair</p>
                        <p className="font-bold text-2xl tracking-tight">{currentBias.pair}</p>
                    </div>
                    <div className="text-right">
                         <span className={`${strengthBadgeClass} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                            {currentBias.strength} {currentBias.bias}
                        </span>
                    </div>
                </div>
            </div>
             <p className="text-[10px] text-white/40 text-center mt-2">Tap to switch pairs • Auto-rotates 1m</p>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { pageData, setDashboardData, setMarketNewsData } = usePageData();
    const { overview, error } = pageData.dashboard;
    const [isLoading, setIsLoading] = useState(!overview);
    const navigate = useNavigate();

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

    const handleTrendClick = (pair: string) => {
        // Pre-fill market news data for the selected pair and navigate
        setMarketNewsData({ result: null, asset: pair, error: null });
        navigate('/market-news');
    };

    const quickActionClass = "flex flex-col items-center justify-center p-3 rounded-lg bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors border border-gray-200 dark:border-white/5 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 gap-2 text-center h-20 w-full shadow-sm hover:shadow-md";

    return (
        <section className="space-y-6 animate-fade-in pb-10">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold">
                        <span className="animated-gradient-text">Global Market Pulse</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        AI-powered real-time market intelligence.
                    </p>
                </div>
                <div className="text-xs text-gray-400 font-mono bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                     Last Update: {overview ? new Date(overview.lastUpdated).toLocaleTimeString() : '--:--'}
                </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-4 gap-4">
                 <button onClick={() => fetchOverview()} className={quickActionClass}>
                    <i className="fas fa-sync text-lg text-blue-500"></i> Refresh Data
                 </button>
                 <button onClick={() => navigate('/market-news')} className={quickActionClass}>
                    <i className="fas fa-newspaper text-lg text-purple-500"></i> Market News
                 </button>
                 <button onClick={() => navigate('/predictor')} className={quickActionClass}>
                    <i className="fas fa-bolt text-lg text-yellow-500"></i> Event Risk
                 </button>
                 <button onClick={() => navigate('/journal')} className={quickActionClass}>
                    <i className="fas fa-book text-lg text-green-500"></i> My Journal
                 </button>
            </div>


            {isLoading && (
                <div className="py-20 flex flex-col items-center justify-center bg-white/20 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Spinner />
                    <p className="mt-4 text-gray-500 dark:text-gray-400 animate-pulse text-sm">Gathering institutional intelligence...</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="max-w-2xl mx-auto">
                     <ErrorDisplay error={error} />
                     <button onClick={fetchOverview} className="mt-4 mx-auto block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">Try Again</button>
                </div>
            )}

            {overview && !isLoading && (
                <>
                    {/* Top Section: Market Condition */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                         <div className="md:col-span-8">
                             <Card title="Market Condition" icon="fas fa-globe" className="h-full">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 h-full items-center">
                                     <div className="flex flex-col justify-center">
                                         <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Sentiment</p>
                                         <SentimentBadge value={overview.marketCondition.sentiment} />
                                     </div>
                                     
                                     <div className="flex flex-col justify-center">
                                         <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Volatility</p>
                                         <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                {[1,2,3].map(i => (
                                                    <div key={i} className={`w-1.5 h-4 rounded-full ${
                                                        (overview.marketCondition.volatility === 'High' && i <= 3) || 
                                                        (overview.marketCondition.volatility === 'Medium' && i <= 2) ||
                                                        (overview.marketCondition.volatility === 'Low' && i <= 1) 
                                                        ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}></div>
                                                ))}
                                            </div>
                                            <span className="text-sm font-semibold">{overview.marketCondition.volatility}</span>
                                         </div>
                                     </div>

                                     <div className="flex flex-col justify-center">
                                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Active Session</p>
                                          <div className="text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-300 px-2 py-1 rounded border border-blue-500/20 truncate">
                                             {overview.marketCondition.dominantSession || "N/A"}
                                          </div>
                                     </div>

                                     <div className="flex flex-col justify-center">
                                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Key Driver</p>
                                          <div className="text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-300 px-2 py-1 rounded border border-purple-500/20 truncate" title={overview.marketCondition.marketDriver}>
                                             {overview.marketCondition.marketDriver || "N/A"}
                                          </div>
                                     </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Trending Pairs</p>
                                    <div className="flex flex-wrap gap-2">
                                    {overview.marketCondition.trendingPairs.map((tp, i) => (
                                        <span key={i} className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${
                                            tp.strength === 'Strong' 
                                            ? 'bg-green-500/5 text-green-700 dark:text-green-400 border-green-500/20' 
                                            : 'bg-red-500/5 text-red-700 dark:text-red-400 border-red-500/20'
                                        }`}>
                                            <b>{tp.name}</b> <i className={`fas fa-arrow-${tp.strength === 'Strong' ? 'up' : 'down'} text-[10px]`}></i>
                                        </span>
                                    ))}
                                    </div>
                                </div>
                             </Card>
                         </div>
                         <div className="md:col-span-4 h-full">
                             {/* Replaced static Daily Bias with new animated component */}
                             <DailyBiasCard biases={overview.dailyBiases || []} />
                         </div>
                    </div>

                    {/* Middle Section: Technicals & Economy */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         
                         {/* Technical Summary with Sparklines */}
                         <Card title="Technical Trend Scanner" icon="fas fa-chart-line">
                            <div className="space-y-4">
                                {overview.technicalSummary.dominantTrends.map((t, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => handleTrendClick(t.pair)}
                                        className="flex items-center justify-between p-3 -mx-2 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                                        title={`View detailed analysis for ${t.pair}`}
                                    >
                                        <div className="w-20">
                                            <span className="font-bold text-sm block group-hover:text-red-500 transition-colors">{t.pair}</span>
                                            <span className={`text-[10px] ${t.direction.includes('Up') ? 'text-green-500' : t.direction.includes('Down') ? 'text-red-500' : 'text-gray-400'}`}>
                                                {t.direction}
                                            </span>
                                        </div>
                                        <div className="flex-1 mx-4 h-8">
                                            <Sparkline 
                                                data={t.sparkline} 
                                                color={t.direction.includes('Up') ? '#22c55e' : t.direction.includes('Down') ? '#ef4444' : '#9ca3af'} 
                                            />
                                        </div>
                                        <div className="text-right w-24">
                                             <span className="text-[10px] text-gray-500 block uppercase">Key Level</span>
                                             <span className="text-xs font-mono font-medium">
                                                 {overview.technicalSummary.keyLevels.find(k => k.pair === t.pair)?.level || '---'}
                                             </span>
                                        </div>
                                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </Card>

                         {/* Economic Data */}
                         <Card title="Economic Calendar" icon="fas fa-calendar-alt">
                            <div className="space-y-4">
                                <div className="mb-4">
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Recently Released</h3>
                                    {overview.economicData.recentEvents.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm mb-2 border-l-2 pl-3 border-gray-300 dark:border-gray-600">
                                            <span className="font-medium truncate mr-2" title={e.event}>{e.event}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 ${
                                                e.impact === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>{e.result}</span>
                                        </div>
                                    ))}
                                    {overview.economicData.recentEvents.length === 0 && <p className="text-xs text-gray-400 italic">No high-impact events recently.</p>}
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Coming Up</h3>
                                    {overview.economicData.upcomingEvents.map((e, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-2 rounded-lg mb-2">
                                            <div className="text-center bg-white dark:bg-black/30 rounded px-2 py-1 min-w-[50px] shadow-sm">
                                                <span className="block text-xs font-bold">{e.time.split(' ')[0]}</span>
                                                <span className="block text-[9px] text-gray-400">{e.time.split(' ')[1]}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold leading-tight truncate" title={e.event}>{e.event}</p>
                                                <p className="text-[10px] text-red-500">{e.expectedImpact} Impact</p>
                                            </div>
                                        </div>
                                    ))}
                                     {overview.economicData.upcomingEvents.length === 0 && <p className="text-xs text-gray-400 italic">No major events upcoming.</p>}
                                </div>
                            </div>
                         </Card>
                    </div>

                    {/* Bottom Section: Trading Opportunities & Outlook */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Trading Opportunities */}
                        <div className="md:col-span-2">
                            <Card title="High Probability Setups" icon="fas fa-crosshairs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {overview.tradingOpportunities.highProbabilitySetups.map((setup, i) => (
                                        <div key={i} className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-0 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${setup.signal === 'Buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-xl tracking-tight">{setup.pair}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`text-xs font-bold uppercase ${setup.signal === 'Buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{setup.signal}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                                            <span className="text-xs text-gray-500">{setup.strategy}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${
                                                        setup.riskLevel === 'Low' ? 'border-green-500/30 text-green-600' : 
                                                        setup.riskLevel === 'Medium' ? 'border-yellow-500/30 text-yellow-600' : 
                                                        'border-red-500/30 text-red-600'
                                                    }`}>{setup.riskLevel} Risk</span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 mb-4 bg-black/5 dark:bg-black/20 p-2 rounded-lg">
                                                     <div className="text-center">
                                                         <p className="text-[9px] text-gray-500 uppercase font-bold">Entry</p>
                                                         <p className="text-xs font-mono font-medium">{setup.entry || '---'}</p>
                                                     </div>
                                                     <div className="text-center border-l border-gray-300 dark:border-white/10">
                                                         <p className="text-[9px] text-gray-500 uppercase font-bold">Stop Loss</p>
                                                         <p className="text-xs font-mono font-medium text-red-500">{setup.stopLoss || '---'}</p>
                                                     </div>
                                                     <div className="text-center border-l border-gray-300 dark:border-white/10">
                                                         <p className="text-[9px] text-gray-500 uppercase font-bold">Target</p>
                                                         <p className="text-xs font-mono font-medium text-green-500">{setup.takeProfit || '---'}</p>
                                                     </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>AI Confidence</span>
                                                        <span className="font-bold">{setup.confidence}%</span>
                                                    </div>
                                                    <ConfidenceMeter value={setup.confidence} />
                                                </div>

                                                <div className="mt-3 text-right">
                                                    <span className="text-[10px] text-gray-400 font-mono">R:R Ratio: {setup.rrRatio || '1:2+'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex gap-6 text-xs text-gray-500 justify-end">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-shield-alt text-gray-400"></i>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Market Risk:</span> {overview.tradingOpportunities.riskAssessment.marketRisk}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-coins text-gray-400"></i>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Rec. Size:</span> {overview.tradingOpportunities.riskAssessment.positionSizing}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* 24H Outlook */}
                        <div className="md:col-span-1">
                             <Card title="Next 24H Outlook" icon="fas fa-binoculars" className="h-full">
                                <div className="space-y-3">
                                    {overview.next24hOutlook.map((item, i) => (
                                        <div key={i} className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-sm">{item.pair}</span>
                                                <span className={`text-[10px] font-bold uppercase ${
                                                    item.bias === 'Bullish' ? 'text-green-500' : item.bias === 'Bearish' ? 'text-red-500' : 'text-gray-400'
                                                }`}>{item.bias}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">
                                                {item.outlook}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                             </Card>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};

export default Dashboard;
