
import { TradeEntry, JournalFeedback } from '../types';

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    const response = await fetch('/api/journalFeedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades }),
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
        throw new Error(result.message || 'Failed to get journal feedback.');
    }

    return result.data as JournalFeedback;
};
