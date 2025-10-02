
import { AnalysisResult } from '../types';

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
    
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            chartFiles: chartFilesBase64, 
            riskReward, 
            tradingStyle 
        }),
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
        throw new Error(result.message || 'Failed to analyze chart.');
    }

    return result.data as AnalysisResult;
};
