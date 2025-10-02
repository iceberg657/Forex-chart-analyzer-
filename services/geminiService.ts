import { AnalysisResult, BotLanguage, IndicatorLanguage } from '../types';
import { apiClient } from './apiClient';

// --- UTILITIES ---

const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('FileReader result is not a string'));
      }
      const result = reader.result;
      const data = result.split(',')[1];
      const mimeType = file.type;
      resolve({ data, mimeType });
    };
    reader.onerror = error => reject(error);
  });
};

// --- SERVICE FUNCTIONS ---

export const analyzeChart = async (
  chartFiles: { [key: string]: File | null },
  riskReward: string,
  tradingStyle: string
): Promise<AnalysisResult> => {
    const imageParts: { [key: string]: { mimeType: string, data: string } | null } = {
        higher: null,
        primary: null,
        entry: null,
    };

    for (const key of Object.keys(chartFiles)) {
        if (chartFiles[key]) {
            imageParts[key] = await fileToBase64(chartFiles[key]!);
        }
    }
    
    return apiClient.post<AnalysisResult>('analyzeChart', {
        imageParts,
        riskReward,
        tradingStyle,
    });
};

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
    return apiClient.post<string>('createBot', { description, language });
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    return apiClient.post<string>('createIndicator', { description, language });
};
