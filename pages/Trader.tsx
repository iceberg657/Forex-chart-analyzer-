

import React, { useState, useCallback } from 'react';
import { AnalysisResult, GroundingSource } from '../types';
import { analyzeChart } from '../services/geminiService';
import Spinner from '../components/Spinner';
import { TRADING_STYLES } from '../constants';

const SourcesCard: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sources</h3>
      <div className="bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg">
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

const SignalCard: React.FC<{ signal: 'BUY' | 'SELL' | 'NEUTRAL'; confidence: number }> = ({ signal, confidence }) => {
    const signalInfo = {
        BUY: {
            color: 'green',
            text: 'Strong Buy Signal'
        },
        SELL: {
            color: 'red',
            text: 'Strong Sell Signal'
        },
        NEUTRAL: {
            color: 'gray',
            text: 'Neutral / Awaiting Breakout'
        }
    }
    const { color, text } = signalInfo[signal];
    const bgColor = `bg-${color}-100 dark:bg-${color}-900/50`;
    const textColor = `text-${color}-800 dark:text-${color}-200`;
    const borderColor = `border-${color}-500`;

    return (
        <div className={`p-6 rounded-xl border ${borderColor} ${bgColor} shadow-md`}>
            <div className="flex justify-between items-center">
                <div>
                    <p className={`text-sm font-medium ${textColor}`}>Signal</p>
                    <p className={`text-2xl font-bold ${textColor}`}>{text}</p>
                </div>
                <div>
                    <p className={`text-sm font-medium ${textColor}`}>Confidence</p>
                    <p className={`text-2xl font-bold text-right ${textColor}`}>{confidence}%</p>
                </div>
            </div>
        </div>
    )
}

const Trader: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [riskReward, setRiskReward] = useState<string>('1:3');
  const [tradingStyle, setTradingStyle] = useState<string>(TRADING_STYLES[1]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null); // Reset result when new image is uploaded
      setError(null);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload a chart image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeChart(imageFile, riskReward, tradingStyle);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, riskReward, tradingStyle]);
  
  const riskRewardOptions = ['1:1', '1:2', '1:3', '1:4', '1:5'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Left Column: Input */}
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center lg:text-left">Chart Analysis</h1>
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg p-6 space-y-6">
          
          <div>
            <label htmlFor="chart-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">1. Upload Chart Screenshot</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-red-600 dark:text-red-500 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, WEBP up to 10MB</p>
              </div>
            </div>
          </div>
          
          {previewUrl && (
            <div className="mt-4">
              <img src={previewUrl} alt="Chart preview" className="rounded-md w-full object-contain" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="trading-style" className="block text-sm font-medium text-gray-700 dark:text-gray-300">2. Trading Style</label>
              <select id="trading-style" value={tradingStyle} onChange={e => setTradingStyle(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white">
                {TRADING_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="risk-reward" className="block text-sm font-medium text-gray-700 dark:text-gray-300">3. Risk/Reward Ratio</label>
              <select id="risk-reward" value={riskReward} onChange={e => setRiskReward(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white">
                {riskRewardOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={isLoading || !imageFile} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-red-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
            {isLoading ? 'Analyzing...' : 'Analyze Chart'}
          </button>
        </div>
      </div>
      
      {/* Right Column: Output */}
      <div className="mt-10 lg:mt-0">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center lg:text-left">Analysis Result</h2>
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
            {isLoading && <Spinner />}
            {error && <div className="text-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>}
            {!isLoading && !error && !result && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>Your analysis will appear here.</p>
                </div>
            )}
            {result && (
                <div className="w-full animate-fade-in">
                  <SignalCard signal={result.signal} confidence={result.confidence} />
                  <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-100 dark:bg-gray-900/70 p-3 rounded-lg"><span className="font-semibold text-gray-600 dark:text-gray-400">Asset:</span> <span className="font-mono">{result.asset}</span></div>
                        <div className="bg-gray-100 dark:bg-gray-900/70 p-3 rounded-lg"><span className="font-semibold text-gray-600 dark:text-gray-400">Timeframe:</span> <span className="font-mono">{result.timeframe}</span></div>
                      </div>

                      {result.signal !== 'NEUTRAL' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
                          <div className="bg-gray-100 dark:bg-gray-900/70 p-3 rounded-lg"><p className="font-semibold text-gray-600 dark:text-gray-400 text-xs">Entry</p><p className="font-mono font-bold text-lg">{result.entry}</p></div>
                          <div className="bg-red-100 dark:bg-red-900/70 p-3 rounded-lg"><p className="font-semibold text-red-700 dark:text-red-300 text-xs">Stop Loss</p><p className="font-mono font-bold text-lg text-red-800 dark:text-red-200">{result.stopLoss}</p></div>
                          <div className="bg-green-100 dark:bg-green-900/70 p-3 rounded-lg"><p className="font-semibold text-green-700 dark:text-green-300 text-xs">Take Profit(s)</p><p className="font-mono font-bold text-lg text-green-800 dark:text-green-200">{result.takeProfits.join(', ')}</p></div>
                        </div>
                      ) : (
                        <div className="text-center bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg">
                           <p className="font-semibold text-gray-700 dark:text-gray-300">Monitor key levels provided in the analysis for a potential breakout.</p>
                        </div>
                      )}
                      
                      <div className="pt-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reasoning</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{result.reasoning}</p>
                      </div>

                      <div className="pt-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Key Points</h3>
                          <ul className="space-y-2 text-sm">
                            {result.tenReasons.map((reason, index) => (
                                <li key={index} className="flex items-start p-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
                                  <span className="mr-2">{reason.charAt(0)}</span>
                                  <span className="flex-1">{reason.substring(2)}</span>
                                </li>
                            ))}
                          </ul>
                      </div>
                      {result.alternativeScenario && (
                        <div className="pt-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            Invalidation / Alternative Scenario
                          </h3>
                          <div className="text-sm p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">
                            <p className="leading-relaxed">{result.alternativeScenario}</p>
                          </div>
                        </div>
                      )}
                  </div>
                  <SourcesCard sources={result.sources || []} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Trader;
