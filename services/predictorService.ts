
import { PredictedEvent } from '../types';

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    const response = await fetch('/api/predictions', {
        method: 'POST', // Using POST for consistency with other API calls
        headers: { 'Content-Type': 'application/json' },
    });
    
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to get predictions.');
    }

    return result.data as PredictedEvent[];
};
