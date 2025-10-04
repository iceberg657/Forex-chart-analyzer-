

import React, { useState, useEffect } from 'react';
import { getPredictions } from '../services/predictorService';
import { PredictedEvent, GroundingSource } from '../types';
import Spinner from '../components/Spinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { usePageData } from '../hooks/usePageData';

const SourcesCard: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sources</h4>
      <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg">
        <ul className="space-y-1">
          {sources.map((source, index) => (
            <li key={index} className="flex items-center">
              <svg className="w-3 h-3 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
              <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate" title={source.title}>
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
    const { event_description, asset, predicted_impact, probability, potential_effect, sources } = event;
    
    const impactInfo = {
        High: { color: 'red', icon: 'fa-triangle-exclamation' },
        Medium: { color: 'yellow', icon: 'fa-bolt' },
        Low: { color: 'blue', icon: 'fa-info-circle' }
    };
    const { color, icon } = impactInfo[predicted_impact];
    const probabilityPercentage = (probability * 100).toFixed(0);

    return (
        <div className={`bg-black/10 dark:bg-white/5 border-l-4 border-${color}-500 p-4 rounded-lg shadow-md`}>
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex-1 pr-4">{event_description}</h3>
                <div className={`text-center text-${color}-500`}>
                    <i className={`fas ${icon} text-xl`}></i>
                    <p className="text-xs font-bold mt-1">{predicted_impact} Impact</p>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{potential_effect}</p>
            <div className="flex items-center justify-between mt-4 text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-200 bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
                    Asset: {asset}
                </span>
                <div className="w-1/3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Probability</span>
                        <span>{probabilityPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                        <div className={`bg-${color}-500 h-1.5 rounded-full`} style={{ width: `${probabilityPercentage}%` }}></div>
                    </div>
                </div>
            </div>
            {sources && <SourcesCard sources={sources} />}
        </div>
    );
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
        if (!events) {
            fetchPredictions();
        }
    }, []);

    return (
        <div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Event Predictor</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Upcoming market-moving events forecasted by our Apex AI Oracle.</p>
            </div>

            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Forecasted Events</h2>
                    <button onClick={fetchPredictions} disabled={isLoading} className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50">
                        <i className={`fas fa-sync ${isLoading ? 'animate-spin' : ''}`}></i> Refresh
                    </button>
                </div>

                {isLoading && <div className="py-10"><Spinner /></div>}
                {error && !isLoading && <ErrorDisplay error={error} />}

                {!isLoading && !error && (
                    <div className="space-y-4">
                        {events && events.length > 0 ? (
                            events.map((event, index) => <EventCard key={index} event={event} />)
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No significant events are forecasted at this moment. The Oracle is contemplating the markets.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Predictor;
