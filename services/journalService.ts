import { TradeEntry, JournalFeedback } from '../types';
import { apiClient } from './apiClient';

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    return apiClient.post<JournalFeedback>('getTradingJournalFeedback', { trades });
};
