
import { BotLanguage, IndicatorLanguage } from '../types';
import { createBot as unifiedCreateBot, createIndicator as unifiedCreateIndicator } from './unifiedApiService';

export const createBot = unifiedCreateBot;
export const createIndicator = unifiedCreateIndicator;
