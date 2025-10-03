
import { TradeEntry } from '../types';

export const getAnalysisPrompt = (tradingStyle: string, riskReward: string): string => `You are 'Oracle', an apex-level AI quantitative analyst. Your task is to implement a unified reasoning architecture to produce high-probability trade setups. You are consistent, logical, and your analysis is institutional-grade. Your entire response MUST be a single, valid JSON object that adheres to the provided schema. ...`;

export const getBotPrompt = (description: string, language: string): string => `You are an expert MQL developer...`;

export const getIndicatorPrompt = (description: string, language: string): string => {
    if (language === 'Pine Script') {
        return `You are an expert Pine Script developer...`;
    } else {
        return `You are an expert MQL developer...`;
    }
};

export const getChatSystemInstruction = (): string => `You are the Oracle, a senior institutional quantitative analyst AI...`;

export const getMarketSentimentPrompt = (asset: string): string => `You are 'Oracle', an apex-level trading AI...`;

export const getJournalFeedbackPrompt = (trades: TradeEntry[]): string => `You are 'Oracle', an apex-level trading AI and performance coach...`;

export const getPredictorPrompt = (): string => `You are 'Oracle', an apex-level trading AI...`;
