
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
        if (!biases || biases.length === 0) return;
        const interval = setInterval(() => {
            triggerTransition();
        }, 60000); // 1 minute
        return () => clearInterval(interval);
    }, [biases?.length]);

    const triggerTransition = (nextIndex?: number) => {
        if (!biases || biases.length === 0) return;
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

    const currentBias = biases[currentIndex] || biases[0];
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
                                            {overview.marketCondition.volatility === 'High' && <div className="flex gap-1"><div className="w-1.5 h-4 bg-red-500 rounded-sm"></div><div className="w-1.5 h-4 bg-red-500 rounded-sm"></div><div className="w-1.5 h-4 bg-red-500 rounded-sm"></div></div>}
                                            {overview.marketCondition.volatility === 'Medium' && <div className="flex gap-1"><div className="w-1.5 h-4 bg-yellow-500 rounded-sm"></div><div className="w-1.5 h-4 bg-yellow-500 rounded-sm"></div><div className="w-1.5 h-4 bg-gray-300 dark:bg-gray-700 rounded-sm"></div></div>}
                                            {overview.marketCondition.volatility === 'Low' && <div className="flex gap-1"><div className="w-1.5 h-4 bg-green-500 rounded-sm"></div><div className="w-1.5 h-4 bg-gray-300 dark:bg-gray-700 rounded-sm"></div><div className="w-1.5 h-4 bg-gray-300 dark:bg-gray-700 rounded-sm"></div></div>}
                                            <span className="font-bold text-sm">{overview.marketCondition.volatility}</span>
                                         </div>
                                     </div>
                                      <div className="flex flex-col justify-center">
                                         <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Active Session</p>
                                         <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded truncate border border-blue-200 dark:border-blue-800">
                                            {overview.marketCondition.dominantSession}
                                         </span>
                                     </div>
                                      <div className="flex flex-col justify-center">
                                         <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Key Driver</p>
                                         <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-semibold px-2 py-1 rounded truncate border border-purple-200 dark:border-purple-800" title={overview.marketCondition.marketDriver}>
                                            {overview.marketCondition.marketDriver}
                                         </span>
                                     </div>
                                </div>
                                
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Trending Pairs</p>
                                    <div className="flex flex-wrap gap-2">
                                        {overview.marketCondition.trendingPairs.map((pair, idx) => (
                                            <span key={idx} className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${pair.strength === 'Strong' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                                                {pair.name}
                                                {pair.strength === 'Strong' ? <i className="fas fa-arrow-up text-[10px]"></i> : <i className="fas fa-arrow-down text-[10px]"></i>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                             </Card>
                         </div>
                         <div className="md:col-span-4">
                            <DailyBiasCard biases={overview.dailyBiases} />
                         </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Technical Summary */}
                        <Card title="Technical Trend Scanner" icon="fas fa-chart-line">
                            <div className="space-y-4">
                                {overview.technicalSummary.dominantTrends.map((trend, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => handleTrendClick(trend.pair)}
                                        className="group cursor-pointer p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between"
                                    >
                                        <div className="w-24">
                                            <p className="font-bold text-gray-800 dark:text-gray-200">{trend.pair}</p>
                                            <p className={`text-[10px] font-bold uppercase ${trend.direction === 'Uptrend' ? 'text-green-500' : trend.direction === 'Downtrend' ? 'text-red-500' : 'text-gray-500'}`}>
                                                {trend.direction}
                                            </p>
                                        </div>
                                        <div className="flex-1 px-4 h-10">
                                            <Sparkline 
                                                data={trend.sparkline} 
                                                color={trend.direction === 'Uptrend' ? '#22c55e' : trend.direction === 'Downtrend' ? '#ef4444' : '#9ca3af'} 
                                            />
                                        </div>
                                        <div className="text-right w-24">
                                             <p className="text-[10px] text-gray-400 uppercase">Key Level</p>
                                             <p className="text-xs font-mono font-medium text-gray-600 dark:text-gray-300">
                                                 {overview.technicalSummary.keyLevels.find(k => k.pair === trend.pair)?.level || '---'}
                                             </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Economic Calendar */}
                        <Card title="Economic Calendar" icon="fas fa-calendar-alt">
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Recently Released</p>
                                    <div className="space-y-2">
                                        {overview.economicData.recentEvents.map((event, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm p-2 bg-black/5 dark:bg-white/5 rounded">
                                                <span className="font-medium truncate mr-2">{event.event}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${event.impact === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                    {event.result}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Coming Up</p>
                                    <div className="space-y-2">
                                        {overview.economicData.upcomingEvents.map((event, idx) => (
                                            <div key={idx} className="flex items-center text-sm p-2 bg-black/5 dark:bg-white/5 rounded border-l-2 border-blue-500">
                                                <div className="w-12 flex-shrink-0 text-xs font-mono text-gray-500 bg-white/50 dark:bg-black/20 p-1 rounded text-center mr-3">
                                                    {event.time}<br/><span className="text-[8px]">GMT</span>
                                                </div>
                                                <div className="flex-1">
                                                     <p className="font-medium">{event.event}</p>
                                                     <p className={`text-[10px] font-bold uppercase ${event.expectedImpact === 'High' ? 'text-red-500' : event.expectedImpact === 'Medium' ? 'text-orange-500' : 'text-gray-500'}`}>
                                                        {event.expectedImpact} Impact
                                                     </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* High Prob Setups */}
                        <div className="lg:col-span-2">
                            <Card title="High Probability Setups" icon="fas fa-crosshairs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {overview.tradingOpportunities.highProbabilitySetups.map((setup, idx) => {
                                        const isBuy = setup.signal === 'Buy';
                                        return (
                                            <div key={idx} className="bg-black/5 dark:bg-white/5 rounded-xl p-5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all group relative overflow-hidden">
                                                {/* Left Accent Bar */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isBuy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                
                                                <div className="flex justify-between items-start mb-4 pl-2">
                                                    <div>
                                                        <h3 className="text-xl font-bold">{setup.pair}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                             <span className={`text-xs font-bold uppercase ${isBuy ? 'text-green-500' : 'text-red-500'}`}>{setup.signal}</span>
                                                             <span className="text-gray-400 text-[10px]">•</span>
                                                             <span className="text-xs text-gray-500 dark:text-gray-400">{setup.strategy}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase flex flex-col items-center justify-center leading-tight ${setup.riskLevel === 'High' ? 'border-red-500/30 text-red-500' : setup.riskLevel === 'Medium' ? 'border-orange-500/30 text-orange-500' : 'border-green-500/30 text-green-500'}`}>
                                                        <span>{setup.riskLevel}</span>
                                                        <span>Risk</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 mb-4 bg-black/5 dark:bg-black/20 rounded-lg p-2 pl-3">
                                                    <div className="text-center">
                                                        <p className="text-[9px] uppercase text-gray-500 font-bold mb-1">Entry</p>
                                                        <p className="font-mono font-bold text-sm">{setup.entry}</p>
                                                    </div>
                                                     <div className="text-center border-l border-gray-300 dark:border-gray-700">
                                                        <p className="text-[9px] uppercase text-red-500 font-bold mb-1">Stop Loss</p>
                                                        <p className="font-mono text-sm text-red-600 dark:text-red-400">{setup.stopLoss}</p>
                                                    </div>
                                                     <div className="text-center border-l border-gray-300 dark:border-gray-700">
                                                        <p className="text-[9px] uppercase text-green-500 font-bold mb-1">Target</p>
                                                        <p className="font-mono text-sm text-green-600 dark:text-green-400">{setup.takeProfit}</p>
                                                    </div>
                                                </div>

                                                <div className="pl-2">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>AI Confidence</span>
                                                        <span>{setup.confidence}%</span>
                                                    </div>
                                                    <ConfidenceMeter value={setup.confidence} />
                                                    <div className="mt-2 text-right">
                                                         <span className="text-[10px] text-gray-500">R:R Ratio: <span className="font-mono text-gray-300">{setup.rrRatio}</span></span>
                                                    </div>
                                                </div>

                                                 {/* New 1H Support/Resistance Section */}
                                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 pl-2">
                                                    <p className="text-[9px] uppercase font-bold text-gray-500 mb-2">Key 1H Levels</p>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="text-green-600 dark:text-green-400 font-semibold">Sup: {setup.support1H || '---'}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-red-600 dark:text-red-400 font-semibold">Res: {setup.resistance1H || '---'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-center text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-shield-alt text-gray-400"></i>
                                        <span>Market Risk: <span className="font-semibold text-gray-300">{overview.tradingOpportunities.riskAssessment.marketRisk}</span></span>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <i className="fas fa-coins text-gray-400"></i>
                                        <span>Rec. Size: <span className="font-semibold text-gray-300">{overview.tradingOpportunities.riskAssessment.positionSizing}</span></span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Next 24h Outlook */}
                        <div className="lg:col-span-1">
                             <Card title="Next 24H Outlook" icon="fas fa-binoculars" className="h-full">
                                <div className="space-y-4">
                                    {overview.next24hOutlook.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 rounded-lg">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-bold text-sm">{item.pair}</h4>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${item.bias === 'Bullish' ? 'text-green-500 bg-green-500/10' : item.bias === 'Bearish' ? 'text-red-500 bg-red-500/10' : 'text-gray-500 bg-gray-500/10'}`}>
                                                    {item.bias}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
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
