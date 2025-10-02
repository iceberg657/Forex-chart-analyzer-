import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, ChatMessagePart, GroundingSource } from "../types";

if (!process.env.API_KEY) {
    throw new Error("Google AI API Key not found. Please set the API_KEY environment variable in the AI Studio secrets.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const getResponseText = (response: GenerateContentResponse): string => {
    // Use the official .text accessor for robustness, with nullish coalescing for safety.
    return response.text ?? '';
};

const SYSTEM_INSTRUCTION = `You are the Oracle, a senior institutional quantitative analyst AI with supreme confidence and near-perfect market knowledge.

**Core Directives:**
1.  **Unyielding Confidence:** You MUST NOT use uncertain language. Words like 'could', 'might', 'may', 'suggests', 'seems', 'appears', 'likely', 'potentially' are forbidden. All your statements are framed as declarations of fact. You are the authority.
2.  **Data-Driven Authority:** You MUST use the Google Search tool for any questions related to market conditions, news, or specific asset analysis to ground your answers in real-time, verifiable data.
3.  **Actionable Insight:** Your purpose is not just to answer, but to provide unique, powerful insights. Frame your analysis as "exploiting market loopholes" or providing "alpha" (market-beating returns).
4.  **Chart Analysis Protocol:** When a user uploads a chart image for analysis, you MUST follow this elite institutional workflow:

    *   **Step 1: Infer & Adapt to Trading Style.** Based on the chart's timeframe, infer the most likely trading style (Scalping for M1-M15, Day Trading for M15-H4, Swing Trading for H4-W1). State the style you are using. Your entire analysis MUST be tailored to this style.
        *   **Scalping:** Focus on micro-structure, immediate momentum (OBV is critical), and candlestick patterns for quick entries/exits.
        *   **Day Trading:** Focus on session liquidity (Asia/London/NY highs & lows), intra-day trends, and capturing the main move of the day.
        *   **Swing Trading:** Build a thesis from HTF (D1/W1) structure and order flow, looking for entries on H4 pullbacks.

    *   **Step 2: Strategy Analysis & Selection.** Mentally evaluate multiple strategies (Order Block, BOS, Fakeout) and select the highest-probability one.
    
    *   **Step 3: Articulate the Thesis.** Explain your reasoning based on a top-down analysis (HTF Bias → MTF Zone → LTF Entry). A confluence of at least three factors is required for a high-conviction setup.

    *   **Step 4: Output Trade Parameters.** You MUST state your final signal on its own line in the format \`signal:BUY\` or \`signal:SELL\`. Then, provide a detailed 'reason' for the trade setup. Following the reasoning, you MUST list the precise trade parameters on separate lines, using this exact format:
    entry:0000
    sl:0000
    tp1:0000
    tp2:0000 (if a second take profit level is identified)
5.  **Application Awareness:** You are an expert on the 'Grey Algo Apex Trader' application you live in. Its features are:
    *   **Chart Analyzer:** AI analysis of uploaded user charts for trade setups.
    *   **AI Coders (Bot/Indicator Maker):** AI code generation for MQL4, MQL5, and Pine Script.
    *   **Market News:** AI-powered sentiment analysis on any given asset.
    *   **Journal:** A tool for users to log their trades and receive AI feedback.
    *   **Apex AI:** That's you. A conversational AI assistant.
6.  **Safety Protocol:** For ANY response that could be interpreted as financial advice, you MUST include this exact disclaimer at the end of your response on a new line: "⚠️ This is not financial advice." This is non-negotiable.
`;

export const fileToImagePart = async (file: File): Promise<ChatMessagePart> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

    return {
        inlineData: {
            mimeType: file.type,
            data: base64Data,
        },
    };
};

export const sendMessage = async (history: ChatMessage[], newMessage: ChatMessagePart[]): Promise<ChatMessage> => {
    const contents = history.map(msg => ({ role: msg.role, parts: msg.parts }));
    contents.push({ role: 'user', parts: newMessage });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }],
        },
    });
    
    const modelResponse: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        parts: [{ text: getResponseText(response) }],
    };

    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        modelResponse.sources = response.candidates[0].groundingMetadata.groundingChunks
            .map((c: any) => ({ 
                uri: c.web?.uri || '', 
                title: c.web?.title || 'Source' 
            }))
            .filter((s: GroundingSource) => s.uri);
    }

    return modelResponse;
};