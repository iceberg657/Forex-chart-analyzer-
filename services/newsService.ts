
import { MarketSentimentResult } from '../types';

export const getMarketNews = async (asset: string): Promise<MarketSentimentResult> => {
    const response = await fetch('/api/marketNews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset }),
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
        throw new Error(result.message || 'Failed to get market news.');
    }

    return result.data as MarketSentimentResult;
};
