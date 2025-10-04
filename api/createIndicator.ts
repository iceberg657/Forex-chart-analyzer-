import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getResponseText = (response: GenerateContentResponse): string => response.text ?? '';

const robustJsonParse = (jsonString: string) => {
    let cleanJsonString = jsonString.trim();
    const markdownMatch = cleanJsonString.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[2]) {
        cleanJsonString = markdownMatch[2];
    } else {
        const start = cleanJsonString.indexOf('{');
        if (start !== -1) {
            const end = cleanJsonString.lastIndexOf('}');
            if (end > start) {
                cleanJsonString = cleanJsonString.substring(start, end + 1);
            }
        }
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (e) {
        console.error("Failed to parse JSON from AI response.", { original: jsonString, cleaned: cleanJsonString });
        throw new Error("The AI's response was unclear or in an unexpected format. Please try again.");
    }
};

const getIndicatorPrompt = (description: string, language: string) => {
    const jsonWrapperInstruction = `You are a JSON code generator. Your response MUST be ONLY a single valid JSON object with the following structure: { "code": "The complete source code here" }. Do not include any other text, markdown, explanations, or greetings. Only return the JSON object.`;
    const coreRequest = `User's Indicator Description: "${description}". The generated code must be complete, compilable, and include customizable 'input' parameters for all key variables (e.g., indicator periods, levels, colors). Add concise comments to explain the core logic.`;

    if (language === 'Pine Script') {
        return `${jsonWrapperInstruction}\n\nLanguage: ${language} (v5 required).\n\n${coreRequest}`;
    } else {
        return `${jsonWrapperInstruction}\n\nLanguage: ${language}.\n\n${coreRequest}`;
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    try {
        const { description, language } = req.body;
        const ai = getAi();
        const prompt = getIndicatorPrompt(description, language);

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const rawText = getResponseText(response);

        const parsedResult = robustJsonParse(rawText);
        const code = parsedResult.code;
        
        if (!code || typeof code !== 'string') {
            throw new Error("API response did not include the generated code in the expected format.");
        }

        res.status(200).json({ code });
    } catch (error) {
        console.error('Error in /api/createIndicator:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
}
