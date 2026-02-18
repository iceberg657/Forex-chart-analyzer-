
import React from 'react';
import { useNavigate } from '../hooks/useAppContext';
import { usePageData } from '../hooks/usePageData';
import { AnalysisResult } from '../types';

const HistoryCard: React.FC<{ result: AnalysisResult; onView: () => void; }> = ({ result, onView }) => {
    const signalInfo = {
        BUY: {
            bgColor: 'bg-green-500/10 dark:bg-green-500/20',
            textColor: 'text-green-800 dark:text-green-200',
            borderColor: 'border-green-500/50',
        },
        SELL: {
            bgColor: 'bg-red-500/10 dark:bg-red-500/20',
            textColor: 'text-red-800 dark:text-red-200',
            borderColor: 'border-red-500/50',
        },
        NEUTRAL: {
            bgColor: 'bg-gray-500/10 dark:bg-gray-500/20',
            textColor: 'text-gray-800 dark:text-gray-200',
            borderColor: 'border-gray-500/50',
        }
    };
    const validatedSignal = ['BUY', 'SELL', 'NEUTRAL'].includes(result.signal) ? result.signal : 'NEUTRAL';
    const info = signalInfo[validatedSignal];

    return (
        <div className={`bg-white/30 dark:bg-black/40 backdrop-blur-md p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-white/20 dark:border-white/10 border-l-4 ${info.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex-1">
                <div className="flex items-center gap-3">
                    <p className="font-bold text-xl text-gray-900 dark:text-white">{result.asset}</p>
                    <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-400">{result.timeframe}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{result.date}</p>
                <div className={`mt-3 inline-block px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest ${info.bgColor} ${info.textColor}`}>
                    {result.signal}
                </div>
            </div>
            <button
                onClick={onView}
                className="w-full sm:w-auto bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/20"
            >
                View Deep Analysis
            </button>
        </div>
    );
};

const History: React.FC = () => {
    const { pageData, clearAnalysisHistory } = usePageData();
    const { history } = pageData.analysisHistory;
    const navigate = useNavigate();

    const handleViewDetails = (result: AnalysisResult) => {
        navigate('/analysis', { state: { result } });
    };
    
    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to delete all analysis history? This action cannot be undone.')) {
            clearAnalysisHistory();
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="p-6 sm:p-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Analysis Archive</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Your institution-grade technical history.</p>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 text-xs font-black py-2.5 px-5 rounded-lg transition-colors border border-red-500/20 uppercase tracking-widest"
                        >
                            <i className="fas fa-trash-alt mr-2"></i>
                            Wipe History
                        </button>
                    )}
                </div>

                {history.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {history.map(result => (
                            <HistoryCard key={result.id} result={result} onView={() => handleViewDetails(result)} />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10">
                        <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center mb-6">
                            <i className="fas fa-history text-4xl text-gray-400 dark:text-gray-500"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Archive Empty</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8 max-w-xs text-center">
                            Start analyzing charts to build your institutional trade history.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-red-600 text-white font-black py-4 px-10 rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-xl shadow-red-500/30 uppercase tracking-widest"
                        >
                            Execute Analysis
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
