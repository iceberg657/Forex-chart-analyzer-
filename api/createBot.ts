
import { GoogleGenAI, Type } from "@google/genai";
import { BotLanguage, MarketSentimentResult, TradeEntry, JournalFeedback } from '../types';

// --- PROMPT GENERATION LOGIC ---
const getJournalFeedbackPrompt = (trades: TradeEntry[]) => `You are 'Oracle', an apex-level trading AI and performance coach. Your role is to analyze a trader's journal and provide objective, actionable feedback with the confidence of an institutional analyst. You are encouraging but direct.

**PRIMARY DIRECTIVE:**
Analyze the provided list of trades and generate a comprehensive performance review. Your entire response MUST be a single, valid JSON object.

**PROVIDED DATA:**
A JSON array of trade objects:
\`\`\`json
${JSON.stringify(trades, null, 2)}
\`\`\`

**ANALYTICAL FRAMEWORK (Internal thought process):**
1.  **Calculate Key Metrics:**
    -   Calculate the total Profit/Loss (P/L).
    -   Calculate the Win Rate (percentage of profitable trades).
    -   Calculate the Average Win and Average Loss.
    -   Determine the Profit Factor (Gross Profit / Gross Loss).
2.  **Identify Patterns & Habits:**
    -   **Strengths:** What is the trader doing right? Do they have a high win rate on a specific asset? Are they good at cutting losses on short trades? Do they let winners run? Find positive patterns based on the data and notes.
    -   **Weaknesses:** What is the trader doing wrong? Are they holding onto losing trades for too long (large average loss)? Are they cutting winners short? Do they over-trade a specific asset with poor results? Do they seem to revenge trade (e.g., a large loss followed by several small, quick trades)? Analyze the notes for emotional language.
3.  **Formulate Actionable Suggestions:**
    -   Based on the identified weaknesses, provide 3-5 specific, actionable suggestions for improvement.
    -   Examples: "Consider implementing a stricter stop-loss rule to reduce your average loss." or "Your win rate on 'EUR/USD' is significantly higher than on other pairs. Consider focusing more on this asset." or "Review your notes for losing trades to identify if emotional decisions are a factor."

**STRICT JSON OUTPUT REQUIREMENTS:**
You MUST respond ONLY with a single, valid JSON object matching the schema below. No markdown, no commentary, just the JSON. Round all numbers to 2 decimal places.

**JSON Schema:**
{
  "overallPnl": "number (Total profit or loss. Positive for profit, negative for loss)",
  "winRate": "number (Percentage of winning trades, 0-100)",
  "strengths": ["string array (2-3 bullet points identifying positive patterns)"],
  "weaknesses": ["string array (2-3 bullet points identifying negative patterns or areas for improvement)"],
  "suggestions": ["string array (3-5 actionable steps the trader can take to improve)"]
}`;


const getMarketSentimentPrompt = (asset: string) => `You are 'Oracle', an apex-level trading AI. Your primary function is to analyze the latest market news and sentiment for a given financial asset. You are objective, data-driven, and concise.

**PRIMARY DIRECTIVE:**
1.  **Perform a Web Search:** Use your web search tool to find the most relevant and recent news, articles, and analyses for the asset: **${asset}**. Focus on information from the last 24-48 hours.
2.  **Analyze Sentiment:** Based on your search results, determine the overall market sentiment.
3.  **Generate JSON Output:** Consolidate your findings into a single, valid JSON object. Your entire response MUST be only this JSON object and nothing else.

**ANALYTICAL FRAMEWORK (Internal thought process):**
- **Identify Key Drivers:** What are the main narratives? Is it an earnings report, a regulatory change, macroeconomic data (like inflation or jobs reports), a major partnership, or a geopolitical event?
- **Assess Tone:** Is the language in the news sources predominantly positive, negative, or neutral? Are analysts bullish or bearish?
- **Quantify Confidence:** Based on the strength and consensus of the news, assign a confidence score to your sentiment analysis. A strong consensus on a major event warrants a high confidence score.
- **Synthesize Information:** Create a brief, neutral summary of the current situation. Extract 3-5 of the most important takeaways as key points.

**STRICT JSON OUTPUT REQUIREMENTS:**
You MUST respond ONLY with a single, valid JSON object matching the schema below. No markdown, no commentary, just the JSON.

**JSON Schema:**
{
  "asset": "string (The name of the asset you analyzed, e.g., '${asset}')",
  "sentiment": "'Bullish', 'Bearish', or 'Neutral'",
  "confidence": "number (A percentage from 0-100 representing your confidence in the sentiment analysis)",
  "summary": "string (A concise, 1-3 sentence summary of the current market situation for the asset)",
  "keyPoints": ["string array (3-5 bullet points of the most critical news or factors influencing the sentiment)"],
  "sources": "This will be populated by the system if web search is used."
}`;


const getBotPrompt = (description: string, language: BotLanguage) => `You are an expert MQL developer. Your task is to generate the code for a trading bot (Expert Advisor) based on the user's description.
- Language: ${language}
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following MQL properties:
#property copyright "Generated by Grey Algo Apex Trader"
#property link      "https://greyalgo-trading.netlify.app"
#property description "Also visit Quant Systems Trading: https://quant-systems-trading.netlify.app"
After these properties, generate the complete, functional, and well-commented ${language} code. The code must be ready to be compiled in MetaEditor. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;


const robustJsonParse = (jsonString: string) => {
    let cleanJsonString = jsonString.trim();
    const match = cleanJsonString.match(/```(json)?\s*(\{[\s\S]*\})\s*```/);
    if (match && match[2]) {
        cleanJsonString = match[2];
    } else {
        const jsonStart = cleanJsonString.indexOf('{');
        const jsonEnd = cleanJsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            cleanJsonString = cleanJsonString.substring(jsonStart, jsonEnd + 1);
        }
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", cleanJsonString);
        throw new Error("Failed to process the request. The AI returned an invalid format.");
    }
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API Key not configured on the server." });
    }

    try {
        const { action, ...body } = req.body;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        switch (action) {
            case 'createBot': {
                const { description, language } = body;
                const prompt = getBotPrompt(description, language);
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                res.setHeader('Content-Type', 'text/plain');
                return res.status(200).send(response.text);
            }
            case 'getMarketSentiment': {
                const { asset } = body;
                const prompt = getMarketSentimentPrompt(asset);
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{googleSearch: {}}] } });
                const parsedResult = robustJsonParse(response.text) as MarketSentimentResult;
                if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks.map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' })).filter((s: any) => s.uri);
                }
                return res.status(200).json(parsedResult);
            }
            case 'getTradingJournalFeedback': {
                const { trades } = body;
                const prompt = getJournalFeedbackPrompt(trades);
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
                const parsedResult = robustJsonParse(response.text) as JournalFeedback;
                return res.status(200).json(parsedResult);
            }
            default:
                return res.status(400).json({ error: "Invalid action." });
        }

    } catch (error: any) {
        console.error("Error in /api/createBot:", error);
        res.status(500).json({ error: "API request failed", details: error.message });
    }
}