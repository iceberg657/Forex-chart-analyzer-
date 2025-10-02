import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnalysisResult, GroundingSource } from '../types';
import ErrorDisplay from '../components/ErrorDisplay';
import { useEdgeLighting } from '../hooks/useEdgeLighting';

interface AnalysisLocationState {
    result?: AnalysisResult;
    error?: string;
}

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

const SignalCard: React.FC<{ signal: 'BUY' | 'SELL' | 'NEUTRAL'; confidence: number }> = ({ signal, confidence }) => {
    const signalInfo = {
        BUY: {
            text: 'Strong Buy Signal',
            bgColor: 'bg-green-500/10 dark:bg-green-500/20',
            textColor: 'text-green-800 dark:text-green-200',
            borderColor: 'border-green-500',
            glowClasses: 'shadow-2xl shadow-green-500/60 dark:shadow-green-400/50',
        },
        SELL: {
            text: 'Strong Sell Signal',
            bgColor: 'bg-red-500/10 dark:bg-red-500/20',
            textColor: 'text-red-800 dark:text-red-200',
            borderColor: 'border-red-500',
            glowClasses: 'shadow-2xl shadow-red-500/60 dark:shadow-red-400/50',
        },
        NEUTRAL: {
            text: 'Neutral / Awaiting Breakout',
            bgColor: 'bg-gray-500/10 dark:bg-gray-500/20',
            textColor: 'text-gray-800 dark:text-gray-200',
            borderColor: 'border-gray-500',
            glowClasses: 'shadow-lg',
        }
    }
    const { text, bgColor, textColor, borderColor, glowClasses } = signalInfo[signal];

    return (
        <div className={`p-6 rounded-xl border ${borderColor} ${bgColor} ${glowClasses} transition-all duration-300`}>
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

const SetupQualityCard: React.FC<{ quality: string }> = ({ quality }) => {
    const qualityInfo: { [key: string]: { text: string; bgColor: string; textColor: string; borderColor: string; icon: React.ReactNode } } = {
        'A+ Setup': {
            text: 'A+ Setup',
            bgColor: 'bg-teal-500/10 dark:bg-teal-400/20',
            textColor: 'text-teal-800 dark:text-teal-200',
            borderColor: 'border-teal-500/80',
            icon: <i className="fas fa-rocket text-teal-500"></i>,
        },
        'A Setup': {
            text: 'A Setup',
            bgColor: 'bg-sky-500/10 dark:bg-sky-400/20',
            textColor: 'text-sky-800 dark:text-sky-200',
            borderColor: 'border-sky-500/80',
            icon: <i className="fas fa-thumbs-up text-sky-500"></i>,
        },
        'B Setup': {
            text: 'B Setup',
            bgColor: 'bg-yellow-500/10 dark:bg-yellow-400/20',
            textColor: 'text-yellow-800 dark:text-yellow-200',
            borderColor: 'border-yellow-500/80',
            icon: <i className="fas fa-check-circle text-yellow-500"></i>,
        },
        'C Setup': {
            text: 'C Setup',
            bgColor: 'bg-orange-500/10 dark:bg-orange-400/20',
            textColor: 'text-orange-800 dark:text-orange-200',
            borderColor: 'border-orange-500/80',
            icon: <i className="fas fa-exclamation-triangle text-orange-500"></i>,
        }
    };

    const info = qualityInfo[quality] || qualityInfo['C Setup'];

    return (
        <div className={`p-3 rounded-lg border ${info.borderColor} ${info.bgColor}`}>
            <div className="flex items-center justify-center space-x-3 text-center">
                <span className="text-2xl">{info.icon}</span>
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Setup Quality</p>
                    <p className={`text-xl font-bold ${info.textColor}`}>{info.text}</p>
                </div>
            </div>
        </div>
    );
};


const Analysis: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { result, error } = (location.state as AnalysisLocationState) || {};
    const { setEdgeLight } = useEdgeLighting();
    
    const onBack = () => navigate('/dashboard');

    useEffect(() => {
        if (result) {
            if (result.signal === 'BUY') setEdgeLight('green');
            else if (result.signal === 'SELL') setEdgeLight('red');
            else setEdgeLight('default');
        } else {
            setEdgeLight('default');
        }
        return () => setEdgeLight('default');
    }, [result, setEdgeLight]);

    if (error) {
        return (
            <div className="text-center py-10">
                <h1 className="text-3xl font-bold text-red-600 dark:text-red-500 mb-4">Analysis Failed</h1>
                <ErrorDisplay error={error} />
                <button onClick={onBack} className="inline-block bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors">
                    Try Again
                </button>
            </div>
        );
    }

    if (!result) {
        return (
          <div className="text-center py-10">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">No Analysis Data</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Please go back to the dashboard and analyze a chart.
            </p>
            <button onClick={onBack} className="inline-block bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors">
                Go to Dashboard
            </button>
          </div>
        );
    }

    return (
        <div>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analysis Result</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Generated by Senior Institutional Quantitative Analyst AI</p>
            </div>
            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6">
                <div className="w-full animate-fade-in">
                    <SignalCard signal={result.signal} confidence={result.confidence} />
                    <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg flex items-baseline justify-between">
                            <span className="font-semibold text-gray-600 dark:text-gray-400">Asset:</span> 
                            <span className="font-mono font-bold text-lg animated-gradient-text">{result.asset}</span>
                          </div>
                          <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg flex items-baseline justify-between">
                            <span className="font-semibold text-gray-600 dark:text-gray-400">Timeframe:</span> 
                            <span className="font-mono text-lg">{result.timeframe}</span>
                          </div>
                        </div>

                         {result.setupQuality && result.signal !== 'NEUTRAL' && (
                            <SetupQualityCard quality={result.setupQuality} />
                        )}

                        {result.signal !== 'NEUTRAL' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
                            <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg"><p className="font-semibold text-gray-600 dark:text-gray-400 text-xs">Entry</p><p className="font-mono font-bold text-lg">{result.entry}</p></div>
                            <div className="bg-red-500/10 dark:bg-red-900/40 p-3 rounded-lg"><p className="font-semibold text-red-700 dark:text-red-300 text-xs">Stop Loss</p><p className="font-mono font-bold text-lg text-red-800 dark:text-red-200">{result.stopLoss}</p></div>
                            <div className="bg-green-500/10 dark:bg-green-900/40 p-3 rounded-lg"><p className="font-semibold text-green-700 dark:text-green-300 text-xs">Take Profit(s)</p><p className="font-mono font-bold text-lg text-green-800 dark:text-green-200">{result.takeProfits.join(', ')}</p></div>
                          </div>
                        ) : (
                          <div className="text-center bg-black/5 dark:bg-white/5 p-4 rounded-lg">
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
                                  <li key={index} className="flex items-start p-2 rounded-md bg-black/5 dark:bg-white/5">
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
                            <div className="text-sm p-3 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-200">
                              <p className="leading-relaxed">{result.alternativeScenario}</p>
                            </div>
                          </div>
                        )}
                    </div>
                    <SourcesCard sources={result.sources || []} />
                     <div className="text-center mt-10">
                        <button onClick={onBack} className="inline-block bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors">
                            Analyze Another Chart
                        </button>
                    </div>
                  </div>
            </div>
        </div>
    );
};

export default Analysis;
