
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
        <div className={`bg-black/5 dark:bg-white/5 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 ${info.borderColor}`}>
            <div className="flex-1">
                <p className="font-bold text-lg text-gray-900 dark:text-white">{result.asset} - {result.timeframe}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{result.date}</p>
                <div className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${info.bgColor} ${info.textColor}`}>
                    {result.signal}
                </div>
            </div>
            <button
                onClick={onView}
                className="w-full sm:w-auto bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
                View Details
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
        <div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Analysis History</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Review your past AI-powered chart analyses.</p>
            </div>

            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6">
                {history.length > 0 ? (
                    <>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleClearHistory}
                                className="bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-500/20 text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                                <i className="fas fa-trash-alt mr-2"></i>
                                Clear History
                            </button>
                        </div>
                        <div className="space-y-4">
                            {history.map(result => (
                                <HistoryCard key={result.id} result={result} onView={() => handleViewDetails(result)} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <i className="fas fa-history text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">No History Yet</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">
                            Your analyzed charts will appear here.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Analyze a Chart
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;