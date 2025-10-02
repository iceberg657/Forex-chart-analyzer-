
import { MarketSentimentResult } from '../types';

export const getMarketNews = async (asset: string): Promise<MarketSentimentResult> => {
    const response = await fetch('/api/marketNews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to get market news.');
    }

    return result.data as MarketSentimentResult;
};
