
import { TradeEntry, JournalFeedback } from '../types';

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    const response = await fetch('/api/journalFeedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to get journal feedback.');
    }

    return result.data as JournalFeedback;
};
