

import { BotLanguage, IndicatorLanguage } from '../types';
import { apiPost } from './api';

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
    const result = await apiPost('/api/createBot', { description, language });
    if (!result.code) {
        throw new Error("API response did not include the generated code.");
    }
    return result.code;
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    const result = await apiPost('/api/createIndicator', { description, language });
    if (!result.code) {
        throw new Error("API response did not include the generated code.");
    }
    return result.code;
};
