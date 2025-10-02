
import { PredictedEvent } from '../types';

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    const response = await fetch('/api/predictions', {
        method: 'POST', // Using POST for consistency with other API calls
        headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Server returned an unreadable error');
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `Server error: ${response.status}`);
        } catch (e) {
            throw new Error(errorText || `Server error: ${response.status}`);
        }
    }
    
    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || 'Failed to get predictions.');
    }

    return result.data as PredictedEvent[];
};
