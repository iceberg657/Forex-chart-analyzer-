import { MarketSentimentResult } from '../types';
import { apiClient } from './apiClient';

export const getMarketNews = async (asset: string): Promise<MarketSentimentResult> => {
    return apiClient.post<MarketSentimentResult>('getMarketNews', { asset });
};
