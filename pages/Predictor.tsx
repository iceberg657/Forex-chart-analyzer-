import React, { useState, useEffect, useMemo } from 'react';
import { getPredictions } from '../services/predictorService';
import { PredictedEvent, GroundingSource } from '../types';
import Spinner from '../components/Spinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { usePageData } from '../hooks/usePageData';

// Helper to safely render text that might accidentally be an object from the AI response
const safeText = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    try {
        return JSON.stringify(val);
    } catch (e) {
        return 'Error';
    }
};

const safeArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (val === null || val === undefined) return [];
    return [val];
};

const SourcesCard: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!Array.isArray(sources) || sources.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-widest">Sources</h4>
      <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-white/10">
        <ul className="space-y-1">
          {sources.map((source, index) => (
            <li key={index} className="flex items-center">
              <i className="fas fa-link text-blue-500 mr-2 text-[10px]"></i>
              <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate font-medium" title={source.title}>
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const EventCard: React.FC<{ event: PredictedEvent }> = ({ event }) => {
    const { event_description, time, direction, currencyPairs, confidence, potential_effect, sources } = event;
    const dispDirection = safeText(direction);
    const isBuy = dispDirection === 'BUY';

    const directionClasses = {
        borderColor: isBuy ? 'border-green-500' : 'border-red-500',
        bgColor: isBuy ? 'bg-green-500/10' : 'bg-red-500/10',
        textColor: isBuy ? 'text-green-500' : 'text-red-500',
        icon: isBuy ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'
    };

    return (
        <div className={`bg-white/30 dark:bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/20 dark:border-white/10 flex flex-col md:flex-row items-center gap-6 border-l-8 ${directionClasses.borderColor} transition-all hover:shadow-lg`}>
            <div className="flex-shrink-0">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${directionClasses.bgColor} shadow-inner`}>
                    <i className={`fas ${directionClasses.icon} text-4xl ${directionClasses.textColor}`}></i>
                </div>
                <div className="text-center mt-3">
                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded bg-black/10 dark:bg-white/10 ${directionClasses.textColor}`}>
                        {dispDirection}
                    </span>
                </div>
            </div>
            
            <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                    <h3 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tight leading-none">{safeText(event_description)}</h3>
                    <span className="text-xs font-black bg-gray-500/10 dark:bg-white/10 px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-300 flex-shrink-0 border border-white/10 shadow-sm uppercase tracking-widest">{safeText(time)}</span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium leading-relaxed">{safeText(potential_effect)}</p>

                <div className="flex items-center gap-2 flex-wrap mb-4">
                    {safeArray(currencyPairs).map((pair, idx) => (
                        <span key={idx} className="text-[10px] font-bold bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300 border border-white/5 uppercase tracking-wider">
                            {safeText(pair)}
                        </span>
                    ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">Oracle Confidence</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`font-black text-lg ${directionClasses.textColor}`}>{Number(confidence) || 0}%</span>
                            <div className="w-20 h-1.5 bg-gray-500/20 rounded-full overflow-hidden">
                                <div className={`h-full ${isBuy ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Number(confidence) || 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                {safeArray(sources).length > 0 && <SourcesCard sources={safeArray(sources)} />}
            </div>
        </div>
    );
};

const groupEventsByDate = (events: PredictedEvent[] | null): Record<string, PredictedEvent[]> => {
    if (!Array.isArray(events)) return {};
    return events.reduce((acc, event) => {
        const groupKey = `${safeText(event.day)}, ${safeText(event.date)}`;
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(event);
        return acc;
    }, {} as Record<string, PredictedEvent[]>);
};

const Predictor: React.FC = () => {
    const { pageData, setPredictorData } = usePageData();
    const { events, error } = pageData.predictor;
    const [isLoading, setIsLoading] = useState(!events);

    const fetchPredictions = async () => {
        setIsLoading(true);
        try {
            const predictions = await getPredictions();
            setPredictorData({ events: predictions, error: null });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setPredictorData({ events, error: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (!events) fetchPredictions();
    }, []);

    const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);
    const eventDates = Object.keys(groupedEvents);

    return (
        <div className="flex flex-col min-h-screen p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Oracle Predictions</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Neural forecast of imminent institutional volatility.</p>
                </div>
                <button 
                    onClick={fetchPredictions} 
                    disabled={isLoading} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 border border-white/20 dark:border-white/10 font-black py-3 px-8 rounded-2xl transition-all active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50"
                >
                    <i className={`fas fa-sync ${isLoading ? 'animate-spin' : ''}`}></i>
                    {isLoading ? 'Decrypting...' : 'Sync Oracle'}
                </button>
            </div>

            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                    <Spinner />
                    <p className="mt-6 text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest animate-pulse">Accessing Predictive Mainframe...</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="max-w-2xl mx-auto w-full">
                    <ErrorDisplay error={error} />
                    <button onClick={fetchPredictions} className="mt-6 w-full bg-red-600 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-red-500/20">Re-Establish Connection</button>
                </div>
            )}

            {!isLoading && !error && (
                <div className="space-y-12">
                    {eventDates.length > 0 ? (
                        eventDates.map(dateKey => (
                            <div key={dateKey}>
                                <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200 mb-6 border-b-4 border-red-600/20 pb-3 uppercase tracking-tighter inline-block">{dateKey}</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    {safeArray(groupedEvents[dateKey]).map((event, index) => (
                                        <EventCard key={index} event={event} />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-32 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10">
                            <i className="fas fa-bolt text-5xl text-gray-500 mb-6 opacity-30"></i>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dead Calm</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">The Oracle detects no high-impact anomalies in the immediate horizon.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Predictor;