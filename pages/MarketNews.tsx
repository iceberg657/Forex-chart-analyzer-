import React, { useState, useEffect } from 'react';
import { getMarketNews } from '../services/newsService';
import { getRealTimeQuote } from '../services/alphaVantageService';
import { MarketSentimentResult, GroundingSource } from '../types';
import Spinner from '../components/Spinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { usePageData } from '../hooks/usePageData';

const safeArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (val === null || val === undefined) return [];
    return [val];
};

const SourcesCard: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  const sourcesArr = safeArray(sources);
  if (sourcesArr.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sources</h3>
      <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
        <ul className="space-y-2">
          {sourcesArr.map((source, index) => (
            <li key={index} className="flex items-center">
              <i className="fas fa-link text-blue-500 mr-2 text-xs"></i>
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


const SentimentResultDisplay: React.FC<{ result: MarketSentimentResult, onRefresh: () => void, isLoading: boolean }> = ({ result, onRefresh, isLoading }) => {
    const sentimentInfo = {
        Bullish: { icon: <i className="fas fa-arrow-trend-up"></i>, bgColor: 'bg-green-500/10 dark:bg-green-500/20', textColor: 'text-green-800 dark:text-green-200', borderColor: 'border-green-500/50' },
        Bearish: { icon: <i className="fas fa-arrow-trend-down"></i>, bgColor: 'bg-red-500/10 dark:bg-red-500/20', textColor: 'text-red-800 dark:text-red-200', borderColor: 'border-red-500/50' },
        Neutral: { icon: <i className="fas fa-arrows-left-right"></i>, bgColor: 'bg-gray-500/10 dark:bg-gray-500/20', textColor: 'text-gray-800 dark:text-gray-200', borderColor: 'border-gray-500/50' }
    };

    const info = sentimentInfo[result.sentiment] || sentimentInfo.Neutral;
    const priceChange = parseFloat(result.change || '0');
    const priceColor = priceChange >= 0 ? 'text-green-500' : 'text-red-500';
    const priceIcon = priceChange >= 0 ? <i className="fas fa-caret-up"></i> : <i className="fas fa-caret-down"></i>;

    return (
        <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6 mt-8 w-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{result.asset}</h2>
                     {result.price && (
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold text-gray-800 dark:text-white">{result.price}</span>
                            <span className={`text-lg font-semibold ${priceColor} flex items-center gap-1`}>
                                {priceIcon}
                                {result.change} ({result.changePercent})
                            </span>
                        </div>
                    )}
                </div>
                <button onClick={onRefresh} disabled={isLoading} className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50">
                    <i className={`fas fa-sync ${isLoading ? 'animate-spin' : ''}`}></i> Refresh
                </button>
            </div>
            <div className={`flex items-center justify-between p-4 rounded-lg mb-6 ${info.bgColor} border ${info.borderColor}`}>
                <div className="flex items-center space-x-4">
                    <div className={`text-3xl ${info.textColor}`}>{info.icon}</div>
                    <div>
                        <p className={`text-sm font-medium ${info.textColor} opacity-80`}>AI Sentiment</p>
                        <p className={`text-2xl font-bold ${info.textColor}`}>{result.sentiment}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-medium ${info.textColor} opacity-80`}>AI Confidence</p>
                    <p className={`text-2xl font-bold ${info.textColor}`}>{result.confidence}%</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Summary</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{result.summary}</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Key Points from News</h3>
                    <ul className="space-y-2 text-sm">
                        {safeArray(result.keyPoints).map((point, index) => (
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
    const { pageData, setMarketNewsData } = usePageData();
    const { result, asset: savedAsset, error } = pageData.marketNews;

    const [inputAsset, setInputAsset] = useState(savedAsset || '');
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => { if (savedAsset) setInputAsset(savedAsset); }, [savedAsset]);

    const performAnalysis = async (assetToAnalyze: string) => {
        setIsLoading(true);
        setMarketNewsData({ result: null, asset: assetToAnalyze, error: null });

        const sentimentPromise = getMarketNews(assetToAnalyze);
        const quotePromise = getRealTimeQuote(assetToAnalyze);
        
        const [sentimentResult, quoteResult] = await Promise.allSettled([sentimentPromise, quotePromise]);

        let finalResult: MarketSentimentResult | null = null;
        let errors: string[] = [];

        if (sentimentResult.status === 'fulfilled') {
            finalResult = sentimentResult.value;
        } else {
            errors.push(sentimentResult.reason instanceof Error ? sentimentResult.reason.message : 'Failed to get sentiment analysis.');
        }

        if (quoteResult.status === 'fulfilled' && quoteResult.value) {
            if (finalResult) {
                finalResult = { ...finalResult, ...quoteResult.value };
            }
        } else if (quoteResult.status === 'rejected') {
            errors.push(quoteResult.reason instanceof Error ? quoteResult.reason.message : 'Failed to get real-time quote.');
        }
        
        setMarketNewsData({ result: finalResult, asset: assetToAnalyze, error: errors.join('\n') || null });
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const assetToAnalyze = inputAsset.trim();
        if (!assetToAnalyze) {
            setMarketNewsData({ ...pageData.marketNews, error: 'Please enter a financial asset.' });
            return;
        }
        performAnalysis(assetToAnalyze);
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Market Sentiment Analysis</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Get instant news summaries and real-time prices for any asset.</p>
            </div>
            
            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
                    <input
                        type="text"
                        value={inputAsset}
                        onChange={(e) => setInputAsset(e.target.value)}
                        placeholder="Enter an asset (e.g., Bitcoin, XAU/USD, TSLA)"
                        className="flex-grow block w-full pl-4 pr-4 py-3 text-base bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:ring-red-500/50 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white disabled:opacity-50"
                        disabled={isLoading}
                        aria-label="Financial Asset"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full sm:w-auto flex-grow justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-red-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Analyzing...' : 'Get Sentiment'}
                    </button>
                </form>
            </div>

            <div className="mt-8 flex justify-center">
                {isLoading && <Spinner />}
                {error && !isLoading && <ErrorDisplay error={error} />}
                {result && !isLoading && <SentimentResultDisplay result={result} onRefresh={() => performAnalysis(savedAsset)} isLoading={isLoading} />}
            </div>
        </div>
    );
};

export default MarketNews;