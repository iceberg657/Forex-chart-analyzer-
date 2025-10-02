

import { TradeEntry, JournalFeedback } from '../types';
import { apiPost } from './api';

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    const result = await apiPost('/api/journalFeedback', { trades });
    return result.data as JournalFeedback;
};
