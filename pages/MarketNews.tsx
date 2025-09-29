import React, { useState } from 'react';
import { getMarketSentiment } from '../services/geminiService';
import { MarketSentimentResult, GroundingSource } from '../types';
import Spinner from '../components/Spinner';
import ErrorDisplay from '../components/ErrorDisplay';

const SourcesCard: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sources</h3>
      <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
        <ul className="space-y-2">
          {sources.map((source, index) => (
            <li key={index} className="flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-1-1a2 2 0 112.828-2.828L14 7.172a.5.5 0 00-.707-.707L12.586 4.586zM9 12a1 1 0 011-1h1a1 1 0 110 2H9a1 1 0 01-1-1zm-1 4a1 1 0 100 2h3a1 1 0 100-2H8z" clipRule="evenodd" /><path d="M4.586 15.414a2 2 0 010-2.828l3-3a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0zM8 9a1 1 0 011-1h1a1 1 0 110 2H9a1 1 0 01-1-1z" /></svg>
              <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate" title={source.title}>
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};


const SentimentResultDisplay: React.FC<{ result: MarketSentimentResult }> = ({ result }) => {
    const sentimentInfo = {
        Bullish: {
            icon: <i className="fas fa-arrow-trend-up"></i>,
            bgColor: 'bg-green-500/10 dark:bg-green-500/20',
            textColor: 'text-green-800 dark:text-green-200',
            borderColor: 'border-green-500/50',
        },
        Bearish: {
            icon: <i className="fas fa-arrow-trend-down"></i>,
            bgColor: 'bg-red-500/10 dark:bg-red-500/20',
            textColor: 'text-red-800 dark:text-red-200',
            borderColor: 'border-red-500/50',
        },
        Neutral: {
            icon: <i className="fas fa-arrows-left-right"></i>,
            bgColor: 'bg-gray-500/10 dark:bg-gray-500/20',
            textColor: 'text-gray-800 dark:text-gray-200',
            borderColor: 'border-gray-500/50',
        }
    };

    const info = sentimentInfo[result.sentiment];

    return (
        <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6 mt-8 w-full">
            <div className={`flex items-center justify-between p-4 rounded-lg mb-6 ${info.bgColor} border ${info.borderColor}`}>
                <div className="flex items-center space-x-4">
                    <div className={`text-3xl ${info.textColor}`}>{info.icon}</div>
                    <div>
                        <p className={`text-sm font-medium ${info.textColor} opacity-80`}>Sentiment</p>
                        <p className={`text-2xl font-bold ${info.textColor}`}>{result.sentiment}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-medium ${info.textColor} opacity-80`}>Confidence</p>
                    <p className={`text-2xl font-bold ${info.textColor}`}>{result.confidence}%</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Summary</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{result.summary}</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Key Points</h3>
                    <ul className="space-y-2 text-sm">
                        {result.keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start p-2 rounded-md bg-black/5 dark:bg-white/5">
                                <i className="fas fa-newspaper text-red-500/80 dark:text-red-400/80 mt-1 mr-3"></i>
                                <span className="flex-1 text-gray-700 dark:text-gray-300">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <SourcesCard sources={result.sources || []} />
        </div>
    );
};


const MarketNews: React.FC = () => {
    const [asset, setAsset] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MarketSentimentResult | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!asset.trim()) {
            setError('Please enter a financial asset.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const sentimentResult = await getMarketSentiment(asset);
            setResult(sentimentResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Market Sentiment Analysis</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Get instant news summaries and sentiment for any asset.</p>
            </div>
            
            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={asset}
                        onChange={(e) => setAsset(e.target.value)}
                        placeholder="Enter an asset (e.g., Bitcoin, XAU/USD, TSLA)"
                        className="flex-grow block w-full pl-4 pr-4 py-3 text-base bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:ring-red-500/50 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white disabled:opacity-50"
                        disabled={isLoading}
                        aria-label="Financial Asset"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full sm:w-auto flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-red-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Analyzing...' : 'Get Sentiment'}
                    </button>
                </form>
            </div>

            <div className="mt-8 flex justify-center">
                {isLoading && <Spinner />}
                {error && <ErrorDisplay error={error} />}
                {result && <SentimentResultDisplay result={result} />}
            </div>
        </div>
    );
};

export default MarketNews;
