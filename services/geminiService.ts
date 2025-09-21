
import { AnalysisResult, BotLanguage, IndicatorLanguage } from '../types';

// Utility to convert file to base64
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


// --- Public API ---
// These functions are now wrappers that call our own backend endpoints.

export const analyzeChart = async (chartFiles: { [key: string]: File | null }, riskReward: string, tradingStyle: string): Promise<AnalysisResult> => {
  try {
    const filesForApi: { [key: string]: { data: string; mimeType: string } | null } = {
        higher: null, primary: null, entry: null
    };

    for (const key in chartFiles) {
        if (chartFiles[key]) {
            filesForApi[key] = await fileToBase64(chartFiles[key] as File);
        }
    }

    const response = await fetch('/api/analyzeChart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartFiles: filesForApi, riskReward, tradingStyle })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
        throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error("Error analyzing chart:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while analyzing the chart.");
  }
};

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
  try {
    const response = await fetch('/api/createBot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, language })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
        throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
    }

    const code = await response.text();
    return code;

  } catch (error) {
    console.error("Error creating bot:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while generating the bot code.");
  }
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    try {
        const response = await fetch('/api/createIndicator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, language })
        });
    
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
            throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
        }
    
        const code = await response.text();
        return code;
        
    } catch (error) {
    console.error("Error creating indicator:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while generating the indicator code.");
  }
};
