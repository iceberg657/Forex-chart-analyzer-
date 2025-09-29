import React, { useState, useEffect, useMemo } from 'react';
import { TradeEntry, JournalFeedback } from '../types';
import { getTradingJournalFeedback } from '../services/geminiService';
import Spinner from '../components/Spinner';
import ErrorDisplay from '../components/ErrorDisplay';

const JournalFeedbackDisplay: React.FC<{ feedback: JournalFeedback }> = ({ feedback }) => {
    const pnlColor = feedback.overallPnl >= 0 ? 'text-green-400' : 'text-red-400';
    const winRateColor = feedback.winRate >= 50 ? 'text-green-400' : 'text-red-400';

    return (
        <div className="bg-gray-900/50 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 mt-8 w-full animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-white mb-6">Your AI Performance Review</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
                <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Overall P/L</p>
                    <p className={`text-3xl font-bold ${pnlColor}`}>{feedback.overallPnl.toFixed(2)}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <p className={`text-3xl font-bold ${winRateColor}`}>{feedback.winRate.toFixed(1)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center"><i className="fas fa-thumbs-up mr-2"></i>Strengths</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        {feedback.strengths.map((s, i) => <li key={i} className="bg-black/20 p-3 rounded-md">{s}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center"><i className="fas fa-magnifying-glass-chart mr-2"></i>Weaknesses</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        {feedback.weaknesses.map((w, i) => <li key={i} className="bg-black/20 p-3 rounded-md">{w}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-sky-400 mb-3 flex items-center"><i className="fas fa-lightbulb mr-2"></i>Suggestions</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        {feedback.suggestions.map((s, i) => <li key={i} className="bg-black/20 p-3 rounded-md">{s}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const Journal: React.FC = () => {
    const [trades, setTrades] = useState<TradeEntry[]>([]);
    const [newTrade, setNewTrade] = useState({ asset: '', tradeType: 'Long' as 'Long' | 'Short', entryPrice: '', exitPrice: '', notes: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<JournalFeedback | null>(null);

    useEffect(() => {
        try {
            const savedTrades = localStorage.getItem('tradingJournal');
            if (savedTrades) {
                setTrades(JSON.parse(savedTrades));
            }
        } catch (e) {
            console.error("Failed to load trades from localStorage", e);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('tradingJournal', JSON.stringify(trades));
        } catch (e) {
            console.error("Failed to save trades to localStorage", e);
        }
    }, [trades]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewTrade(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTrade = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTrade.asset || !newTrade.entryPrice || !newTrade.exitPrice) {
            setError("Asset, Entry Price, and Exit Price are required.");
            return;
        }
        const entryPrice = parseFloat(newTrade.entryPrice);
        const exitPrice = parseFloat(newTrade.exitPrice);

        if (isNaN(entryPrice) || isNaN(exitPrice)) {
            setError("Prices must be valid numbers.");
            return;
        }

        const trade: TradeEntry = {
            id: new Date().toISOString(),
            asset: newTrade.asset,
            tradeType: newTrade.tradeType,
            entryPrice,
            exitPrice,
            date: new Date().toLocaleDateString(),
            notes: newTrade.notes,
        };
        setTrades(prev => [trade, ...prev]);
        setNewTrade({ asset: '', tradeType: 'Long', entryPrice: '', exitPrice: '', notes: '' });
        setError(null);
    };

    const handleGetFeedback = async () => {
        if (trades.length < 3) {
            setError("Please add at least 3 trades to get a meaningful analysis.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setFeedback(null);
        try {
            const result = await getTradingJournalFeedback(trades);
            setFeedback(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const tradeList = useMemo(() => trades.map(trade => {
        const pnl = trade.tradeType === 'Long' ? trade.exitPrice - trade.entryPrice : trade.entryPrice - trade.exitPrice;
        const pnlColor = pnl >= 0 ? 'text-green-500' : 'text-red-500';
        return (
             <div key={trade.id} className="bg-black/5 dark:bg-white/5 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <p className="font-bold text-lg">{trade.asset} <span className={`text-sm font-medium ${trade.tradeType === 'Long' ? 'text-green-500' : 'text-red-500'}`}>{trade.tradeType}</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{trade.date}</p>
                    {trade.notes && <p className="text-sm mt-1 text-gray-600 dark:text-gray-300 italic">"{trade.notes}"</p>}
                </div>
                <div className="text-right">
                    <p className={`text-xl font-mono font-bold ${pnlColor}`}>{pnl.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{trade.entryPrice} → {trade.exitPrice}</p>
                </div>
            </div>
        );
    }), [trades]);


    return (
        <div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Trading Journal</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Log your trades and get personalized AI-powered feedback.</p>
            </div>

            <form onSubmit={handleAddTrade} className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6 space-y-4 mb-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="asset" value={newTrade.asset} onChange={handleInputChange} placeholder="Asset (e.g., EUR/USD)" className="input-field" />
                    <div className="flex items-center bg-gray-500/10 dark:bg-gray-900/40 rounded-md p-1">
                        <button type="button" onClick={() => setNewTrade(p => ({...p, tradeType: 'Long'}))} className={`flex-1 py-2 rounded-md text-sm transition-colors ${newTrade.tradeType === 'Long' ? 'bg-green-600 text-white' : 'hover:bg-black/10'}`}>Long</button>
                        <button type="button" onClick={() => setNewTrade(p => ({...p, tradeType: 'Short'}))} className={`flex-1 py-2 rounded-md text-sm transition-colors ${newTrade.tradeType === 'Short' ? 'bg-red-600 text-white' : 'hover:bg-black/10'}`}>Short</button>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="entryPrice" value={newTrade.entryPrice} onChange={handleInputChange} type="number" step="any" placeholder="Entry Price" className="input-field" />
                    <input name="exitPrice" value={newTrade.exitPrice} onChange={handleInputChange} type="number" step="any" placeholder="Exit Price" className="input-field" />
                 </div>
                 <textarea name="notes" value={newTrade.notes} onChange={handleInputChange} placeholder="Notes / Reason for trade... (optional)" rows={3} className="input-field w-full" />
                 <button type="submit" className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Add Trade</button>
            </form>

            <style>{`.input-field { background-color: rgba(107, 114, 128, 0.1); border: 1px solid rgba(107, 114, 128, 0.3); padding: 0.75rem 1rem; border-radius: 0.375rem; width: 100%; } .dark .input-field { background-color: rgba(17, 24, 39, 0.4); border-color: rgba(107, 114, 128, 0.5); }`}</style>

            <div className="mt-8">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Trade History</h2>
                    <button onClick={handleGetFeedback} disabled={isLoading || trades.length < 3} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Analyzing...' : 'Analyze My Trading'}
                    </button>
                </div>
                {error && <ErrorDisplay error={error} />}
                {isLoading && <div className="flex justify-center my-4"><Spinner /></div>}
                {feedback && <JournalFeedbackDisplay feedback={feedback} />}
                <div className="space-y-4 mt-8">
                    {trades.length > 0 ? tradeList : <p className="text-center text-gray-500 dark:text-gray-400 py-8">Your trade journal is empty. Add a trade to get started.</p>}
                </div>
            </div>
        </div>
    );
};

export default Journal;