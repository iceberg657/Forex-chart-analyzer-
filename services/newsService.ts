

import { MarketSentimentResult } from '../types';
import { apiPost } from './api';

export const getMarketNews = async (asset: string): Promise<MarketSentimentResult> => {
    const result = await apiPost('/api/marketNews', { asset });
    return result.data as MarketSentimentResult;
};
