
import { BotLanguage, IndicatorLanguage } from '../types';

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
    const response = await fetch('/api/createBot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, language }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create bot.');
    }

    return result.code;
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    const response = await fetch('/api/createIndicator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, language }),
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create indicator.');
    }

    return result.code;
};
