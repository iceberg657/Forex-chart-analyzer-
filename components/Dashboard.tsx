









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

const TradeSetupCard: React.FC<{ setup: any }> = ({ setup }) => {
    const isBuy = setup.signal === 'Buy';
    const colorClass = isBuy ? 'text-green-500' : 'text-red-500';
    const bgClass = isBuy ? 'bg-green-500' : 'bg-red-500';
    const borderClass = isBuy ? 'border-green-500' : 'border-red-500';

    return (
        <div className={`bg-gray-900 rounded-xl p-5 border-l-4 ${borderClass} shadow-lg relative overflow-hidden`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">{setup.pair}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`font-bold ${colorClass}`}>{setup.signal.toUpperCase()}</span>
                        <span className="text-gray-400 text-xs">• {setup.strategy}</span>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold bg-opacity-20 ${bgClass} ${colorClass} border border-opacity-20 ${borderClass}`}>
                    {setup.riskLevel.toUpperCase()} RISK
                </div>
            </div>

            {/* Ticket Info */}
            <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-lg p-3 mb-4">
                 <div>
                    <p className="text-[10px] text-gray-400 uppercase">Entry</p>
                    <p className="text-white font-mono font-bold">{setup.entry}</p>
                 </div>
                 <div>
                    <p className="text-[10px] text-red-400 uppercase">Stop Loss</p>
                    <p className="text-red-300 font-mono font-bold">{setup.stopLoss}</p>
                 </div>
                 <div>
                    <p className="text-[10px] text-green-400 uppercase">Target</p>
                    <p className="text-green-300 font-mono font-bold">{setup.takeProfit}</p>
                 </div>
            </div>

            {/* Confidence & RR */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>AI Confidence</span>
                    <span>{setup.confidence}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                     <div className={`h-full ${bgClass}`} style={{ width: `${setup.confidence}%` }}></div>
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">R:R Ratio: {setup.rrRatio}</p>
            </div>

            {/* Support/Resistance Footer (New) */}
            <div className="border-t border-gray-700 pt-3 grid grid-cols-2 gap-4">
                 <div className="text-center border-r border-gray-700">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Support</p>
                    <p className="text-gray-200 font-mono text-sm">{setup.support}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Resistance</p>
                    <p className="text-gray-200 font-mono text-sm">{setup.resistance}</p>
                 </div>
            </div>
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
                     <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Dashboard</h1>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time AI analysis • Updates hourly</p>
                </div>
                <div className="grid grid-cols-4 gap-2 w-full md:w-auto">
                    <button onClick={() => navigate('/analysis')} className={quickActionClass}>
                         <i className="fas fa-chart-line text-blue-500 text-lg"></i>
                         <span>Analysis</span>
                    </button>
                    <button onClick={() => navigate('/market-news')} className={quickActionClass}>
                         <i className="fas fa-newspaper text-purple-500 text-lg"></i>
                         <span>News</span>
                    </button>
                    <button onClick={() => navigate('/predictor')} className={quickActionClass}>
                         <i className="fas fa-bolt text-yellow-500 text-lg"></i>
                         <span>Predictor</span>
                    </button>
                    <button onClick={() => navigate('/journal')} className={quickActionClass}>
                         <i className="fas fa-book text-green-500 text-lg"></i>
                         <span>Journal</span>
                    </button>
                </div>
            </div>

            {error && <ErrorDisplay error={error} />}
            {isLoading && <div className="py-12"><Spinner /></div>}

            {overview && !isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* TOP SECTION - HUD */}
                    <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                         {/* Market Condition */}
                        <Card title="Market Condition" icon="fas fa-globe">
                             <div className="flex justify-between items-center mb-4">
                                <div>
                                     <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Sentiment</p>
                                     <SentimentBadge value={overview.marketCondition.sentiment} />
                                </div>
                                <div className="text-right">
                                     <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Volatility</p>
                                     <div className="flex items-center gap-1 justify-end">
                                        {[1,2,3].map(i => (
                                            <div key={i} className={`h-3 w-1.5 rounded-sm ${
                                                (overview.marketCondition.volatility === 'High' && i <= 3) ||
                                                (overview.marketCondition.volatility === 'Medium' && i <= 2) ||
                                                (overview.marketCondition.volatility === 'Low' && i <= 1)
                                                ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-700'
                                            }`}></div>
                                        ))}
                                        <span className="text-sm font-bold ml-1">{overview.marketCondition.volatility}</span>
                                     </div>
                                </div>
                             </div>
                             
                             <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm bg-black/5 dark:bg-white/5 p-2 rounded">
                                    <span className="text-gray-600 dark:text-gray-400">Trending Pairs</span>
                                    <div className="flex gap-2">
                                        {overview.marketCondition.trendingPairs.map((p, i) => (
                                            <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${p.strength === 'Strong' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                                {p.name} {p.strength === 'Strong' ? '↑' : '↓'}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <span className="px-2 py-1 text-[10px] uppercase font-bold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                        {overview.marketCondition.dominantSession}
                                    </span>
                                    <span className="px-2 py-1 text-[10px] uppercase font-bold rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 truncate max-w-[150px]" title={overview.marketCondition.marketDriver}>
                                        {overview.marketCondition.marketDriver}
                                    </span>
                                </div>
                             </div>
                        </Card>

                        {/* Daily Bias - Interactive */}
                        <div className="h-full">
                            <DailyBiasCard biases={overview.dailyBiases} />
                        </div>
                        
                        {/* Economic Data */}
                         <Card title="Economic Radar" icon="fas fa-bullhorn">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Recent</p>
                                    <ul className="space-y-2">
                                        {overview.economicData.recentEvents.slice(0, 2).map((e, i) => (
                                            <li key={i} className="flex justify-between items-center text-xs border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                                                <span className="truncate max-w-[120px]" title={e.event}>{e.event}</span>
                                                <span className={`font-medium ${e.impact === 'High' ? 'text-red-500' : 'text-yellow-500'}`}>{e.result}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Upcoming</p>
                                    <ul className="space-y-2">
                                        {overview.economicData.upcomingEvents.slice(0, 2).map((e, i) => (
                                            <li key={i} className="flex justify-between items-center text-xs bg-black/5 dark:bg-white/5 p-1.5 rounded">
                                                <span className="font-mono text-gray-500">{e.time}</span>
                                                <span className="truncate max-w-[100px]" title={e.event}>{e.event}</span>
                                                 <span className={`w-2 h-2 rounded-full ${e.expectedImpact === 'High' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* LEFT COLUMN - Technicals */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card title="Technical Trend Scanner" icon="fas fa-microchip">
                            <div className="space-y-4">
                                {overview.technicalSummary.dominantTrends.map((t, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => handleTrendClick(t.pair)}
                                        className="group cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative"
                                        title="Click for Analysis"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-sm">{t.pair}</span>
                                            <span className={`text-xs font-medium ${t.direction === 'Uptrend' ? 'text-green-500' : t.direction === 'Downtrend' ? 'text-red-500' : 'text-gray-500'}`}>
                                                {t.direction}
                                            </span>
                                        </div>
                                        <div className="h-8">
                                            <Sparkline 
                                                data={t.sparkline} 
                                                color={t.direction === 'Uptrend' ? '#22c55e' : t.direction === 'Downtrend' ? '#ef4444' : '#9ca3af'} 
                                            />
                                        </div>
                                        {/* Hover Tooltip/Arrow */}
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <i className="fas fa-chevron-right text-gray-400"></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        
                        <Card title="Next 24H Outlook" icon="fas fa-clock">
                            <div className="space-y-3">
                                {overview.next24hOutlook.slice(0, 3).map((item, i) => (
                                    <div key={i} className="text-xs border-b border-gray-100 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold">{item.pair}</span>
                                            <span className={`${item.bias === 'Bullish' ? 'text-green-500' : item.bias === 'Bearish' ? 'text-red-500' : 'text-gray-500'}`}>{item.bias}</span>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 leading-tight">{item.outlook}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* CENTER COLUMN - Trade Opps */}
                    <div className="lg:col-span-3">
                        <Card title="High Probability Setups" icon="fas fa-crosshairs" className="h-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                                {overview.tradingOpportunities.highProbabilitySetups.map((setup, index) => (
                                    <TradeSetupCard key={index} setup={setup} />
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* RISK - Bottom Bar */}
                     <div className="lg:col-span-4">
                         <div className="bg-black/80 dark:bg-black/60 backdrop-blur-md rounded-lg p-3 flex flex-wrap justify-between items-center text-xs text-gray-300 border border-white/10">
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-white uppercase"><i className="fas fa-shield-alt mr-2 text-blue-500"></i> Risk Assessment</span>
                                <span className="flex items-center gap-2">
                                    Market Risk: <span className={`font-bold ${overview.tradingOpportunities.riskAssessment.marketRisk === 'High' ? 'text-red-400' : 'text-green-400'}`}>{overview.tradingOpportunities.riskAssessment.marketRisk}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <i className="fas fa-coins text-yellow-500"></i> Rec. Size: <span className="font-bold text-white">{overview.tradingOpportunities.riskAssessment.positionSizing}</span>
                            </div>
                         </div>
                     </div>
                </div>
            )}
        </section>
    );
};

export default Dashboard;
