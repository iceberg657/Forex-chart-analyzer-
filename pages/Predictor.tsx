
import React, { useState, useEffect } from 'react';
import { getPredictions } from '../services/predictorService';
import { PredictedEvent, GroundingSource } from '../types';
import Spinner from '../components/Spinner';
import ErrorDisplay from '../components/ErrorDisplay';

const Sources: React.FC<{ sources?: GroundingSource[] }> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;
    return (
        <div className="mt-2 text-xs">
            {sources.slice(0, 2).map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mr-2 truncate" title={s.title}>{s.title}</a>
            ))}
        </div>
    );
};

const EventCard: React.FC<{ event: PredictedEvent }> = ({ event }) => {
    const biasInfo = event.directionalBias === 'BUY'
        ? { color: 'green', icon: 'fa-arrow-up' }
        : { color: 'red', icon: 'fa-arrow-down' };

    return (
        <div className={`bg-black/10 dark:bg-white/5 border-l-4 border-${biasInfo.color}-500 p-4 rounded-lg shadow-md`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{event.eventName} ({event.currency})</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(event.time).toLocaleString()}</p>
                </div>
                <div className={`text-center text-${biasInfo.color}-500`}>
                    <i className={`fas ${biasInfo.icon} text-2xl`}></i>
                    <p className="font-bold text-sm">{event.directionalBias}</p>
                    <p className="text-xs">{event.confidence}%</p>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">"{event.rationale}"</p>
            <Sources sources={event.sources} />
        </div>
    );
};

const Predictor: React.FC = () => {
    const [events, setEvents] = useState<PredictedEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPredictions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const predictions = await getPredictions();
            setEvents(predictions);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchPredictions();
    }, []);

    return (
        <div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Catalyst Predictor</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Oracle's analysis of high-impact news events for the week ahead.</p>
            </div>

            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Upcoming Market Movers</h2>
                    <button onClick={fetchPredictions} disabled={isLoading} className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50">
                        <i className={`fas fa-sync ${isLoading ? 'animate-spin' : ''}`}></i> Refresh
                    </button>
                </div>

                {isLoading && <div className="py-10"><Spinner /></div>}
                {error && <ErrorDisplay error={error} />}

                {!isLoading && !error && (
                    <div className="space-y-4">
                        {events.length > 0 ? (
                            events.map((event, index) => <EventCard key={index} event={event} />)
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No high-impact events found for the upcoming week, or the Oracle is contemplating the markets.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Predictor;