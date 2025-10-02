

import { AnalysisResult } from '../types';
import { apiPost } from './api';

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

export const analyzeChart = async (
  chartFiles: { [key: string]: File | null },
  riskReward: string,
  tradingStyle: string
): Promise<AnalysisResult> => {
    
    const chartFilesBase64: { [key: string]: { mimeType: string, data: string } | null } = {
        higher: null,
        primary: null,
        entry: null,
    };

    for (const key of Object.keys(chartFiles)) {
        if (chartFiles[key]) {
            chartFilesBase64[key] = await fileToBase64(chartFiles[key]!);
        }
    }
    
    const result = await apiPost('/api/analyze', { 
        chartFiles: chartFilesBase64, 
        riskReward, 
        tradingStyle 
    });

    return result.data as AnalysisResult;
};
