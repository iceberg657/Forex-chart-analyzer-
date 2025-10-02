import { GoogleGenAI, Part, Type, Tool } from "@google/genai";
import { 
    AnalysisResult, 
    BotLanguage, 
    IndicatorLanguage, 
    GroundingSource, 
    MarketSentimentResult, 
    TradeEntry,
    JournalFeedback,
    ChatMessage,
    ChatMessagePart,
    PredictedEvent
} from '../types';

// --- UTILITY ---
const robustJsonParse = (jsonString: string, expectedType: 'object' | 'array' = 'object') => {
    let cleanJsonString = jsonString.trim();
    const regex = expectedType === 'object' 
        ? /```(json)?\s*(\{[\s\S]*\})\s*```/ 
        : /```(json)?\s*(\[[\s\S]*\])\s*```/;
    const match = cleanJsonString.match(regex);

    if (match && match[2]) {
        cleanJsonString = match[2];
    } else {
        const startChar = expectedType === 'object' ? '{' : '[';
        const endChar = expectedType === 'object' ? '}' : ']';
        const jsonStart = cleanJsonString.indexOf(startChar);
        const jsonEnd = cleanJsonString.lastIndexOf(endChar);
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


// --- PROMPTS and LOGIC ---

// --- 1. analyzeChart ---
const getAnalysisPrompt = (
    tradingStyle: string,
    riskReward: string,
    isSingleChart: boolean
) => `You are 'Oracle', an apex-level AI quantitative analyst. Your task is to implement a unified reasoning architecture to produce high-probability trade setups. You are consistent, logical, and your analysis is institutional-grade.

Your entire response MUST be a single, valid JSON object that adheres to the provided schema.

---

### 🏛️ Core Architecture & Decision Flow

You will simulate a modular decision engine. For every analysis, you must follow this internal process:

1.  **Data Ingestion & Preprocessing:** Analyze the provided chart(s), identifying key features: Price Action, Volume, OBV (if present), Support/Resistance, Trendlines, Consolidation Patterns, Order Blocks, BOS/CHoCH, Fair Value Gaps (FVG).
2.  **Context Map Generation:** Build a feature vector (a mental "Context Map") based on a 10-point analysis blueprint. Quantify features like structure bias, candle rejection strength, volume profile, etc.
3.  **Strategy Analysis:** Evaluate the chart against a pool of high-probability strategies (e.g., Order Block Reversal, BOS Continuation, Fakeout/Stop Hunt, Inside Bar Breakout). Each strategy gets an internal \`strategy_score\`.
4.  **Scoring & Selection:** Calculate a \`Final Strategy Score\` for the best-fitting strategy using a weighted formula: \`Final Score = (0.5 * strategy_score) + (0.4 * context_match_score) + (0.1 * htf_alignment_score)\`.
5.  **Execution Plan:** Based on the selected strategy and its final score, generate a precise execution plan (Entry, SL, TP).
6.  **Explainability:** Articulate your reasoning clearly, stating the chosen strategy and the key factors from your Context Map.

---

### 🧠 Trading Style Adaptation (Mandatory)

You MUST adapt your entire methodology, including TFs, scoring thresholds, and risk parameters, to the user's selected trading style. You MUST state which style you are applying in your \`reasoning\`.

*   **If Style is 'Scalping' (M1-M15):**
    *   **TFs:** Analyze M1/M5, using M15 for bias.
    *   **Focus:** Micro-structure breaks, momentum shifts (OBV is critical), candlestick patterns.
    *   **Scoring:** Require a \`Final Strategy Score\` ≥ 70.
    *   **Risk:** Tight SL (e.g., 1x ATR(5) or structure wick), small tiered TPs (e.g., 1:1, 1:2 R:R). Setups are rapid.

*   **If Style is 'Day Trading' (M15-H1):**
    *   **TFs:** Analyze M15/H1, using H4 for bias.
    *   **Focus:** Session liquidity (e.g., London/NY session highs/lows), intra-day trends, structural points.
    *   **Scoring:** Require a \`Final Strategy Score\` ≥ 65.
    *   **Risk:** Standard SL (e.g., 1.5-2x ATR(14) or outside key structure), standard tiered TPs (e.g., 1:3+ R:R).

*   **If Style is 'Swing Trading' (H4-D1):**
    *   **TFs:** Analyze H4/D1, using Weekly for bias.
    *   **Focus:** Major market structure, weekly/daily order flow, significant supply/demand zones.
    *   **Scoring:** Require a \`Final Strategy Score\` ≥ 60, but HTF alignment is critical.
    *   **Risk:** Wider SL (e.g., 2-3x ATR(14) or outside major structure), large R:R targets, potentially letting trades run.

---

### 📈 Strategy Module Reasoning (Internal Checklist)

When evaluating strategies, use these confirmation templates. The more checks that pass, the higher the \`strategy_score\`.

*   **Order Block (Institutional):**
    *   Is there a clear OB in a premium/discount zone?
    *   Does it have an associated imbalance (FVG)?
    *   Does price show a reaction (wick rejection, volume absorption) upon returning to the OB?
*   **BOS / CHoCH (Break of Structure / Change of Character):**
    *   Is there a clean, high-momentum break of a significant structural high/low?
    *   Is the break confirmed by HTF momentum?
    *   Is there a subsequent retest of the broken structure or a return to the origin of the break?
*   **Inside Bar Breakout:**
    *   Is there a clear Inside Bar pattern within a consolidation?
    *   Is volume compressing before the breakout?
    *   Does the breakout occur with a volume spike and a candle closing decisively outside the parent bar?
*   **Fakeout / Stop Hunt (Liquidity Sweep):**
    *   Did price convincingly break a key S/R level or swing point?
    *   Did it rapidly reverse back inside the range, often with a long rejection wick?
    *   This is powerful when it sweeps obvious equal highs/lows.

---

### ⚠️ Critical Handling for Missing OBV

**If the OBV indicator is NOT visible, you MUST NOT refuse the analysis.** Instead, you MUST:
1.  Acknowledge its absence in your \`reasoning\`.
2.  Default to pure Price Action and Smart Money Concepts.
3.  Qualify your analysis by assigning a lower \`confidence\` score and a \`setupQuality\` of 'B Setup' or lower.
4.  **Crucially, you MUST still provide a complete and valid JSON response.**

---

**USER PREFERENCES:**
- Trading Style: ${tradingStyle}
- Risk-to-Reward Ratio: ${riskReward}

**STRICT JSON OUTPUT SCHEMA:**
{
  "asset": "string",
  "timeframe": "string (Primary chart's timeframe)",
  "signal": "'BUY', 'SELL', or 'NEUTRAL'",
  "confidence": "number (Your calculated Final Strategy Score, 0-100)",
  "entry": "string (or 'N/A')",
  "stopLoss": "string (or 'N/A')",
  "takeProfits": ["string array (Provide tiered TPs based on trading style, e.g., ['TP1: 1.2345', 'TP2: 1.2365'])"],
  "setupQuality": "string ('A+ Setup', 'A Setup', 'B Setup', 'C Setup', or 'N/A')",
  "reasoning": "string (State the chosen strategy, its score, and a 2-4 sentence core thesis)",
  "tenReasons": ["string array (5-10 concise points from your Context Map analysis, with emojis: ✅ Bullish, ❌ Bearish, ⚠️ Neutral)"],
  "alternativeScenario": "string (What invalidates your signal?)",
  "sources": "This will be populated by the system if web search is used."
}`;

async function handleAnalyzeChart(body: any) {
    const { imageParts, riskReward, tradingStyle } = body;
    const isSingleChart = !!imageParts.primary && !imageParts.higher && !imageParts.entry;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const parts: Part[] = [{ text: getAnalysisPrompt(tradingStyle, riskReward, isSingleChart) }];
    for (const key of ['higher', 'primary', 'entry']) {
        if (imageParts[key]) {
            parts.push({ text: `${key.charAt(0).toUpperCase() + key.slice(1)} Timeframe Chart:` });
            parts.push({ inlineData: imageParts[key] });
        }
    }
    const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash', 
        contents: { parts }, 
        config: { 
            tools: [{googleSearch: {}}],
            thinkingConfig: { thinkingBudget: 0 } 
        } 
    });
    const parsedResult = robustJsonParse(response.text) as AnalysisResult;
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks.map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' })).filter((s: any) => s.uri);
    }
    return parsedResult;
}

// --- 2. createBot ---
const getBotPrompt = (description: string, language: BotLanguage) => `You are an expert MQL developer. Generate code for a trading bot (Expert Advisor). Language: ${language}. User Description: "${description}". IMPORTANT: At the top, include these properties: #property copyright "Generated by Grey Algo Apex Trader", #property link "https://greyalgo-trading.netlify.app". Generate complete, functional, well-commented ${language} code. Respond with ONLY the raw code.`;

async function handleCreateBot(body: any) {
    const { description, language } = body;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = getBotPrompt(description, language);
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
}

// --- 3. createIndicator ---
const getIndicatorPrompt = (description: string, language: IndicatorLanguage) => {
    if (language === IndicatorLanguage.PINE_SCRIPT) {
        return `You are an expert Pine Script developer. Generate an indicator.
- Language: Pine Script
- User Description: "${description}"
IMPORTANT: At the top, include this header:
// This script was generated by Grey Algo Apex Trader
// Grey Algo Trading: https://greyalgo-trading.netlify.app
// Quant Systems Trading: https://quant-systems-trading.netlify.app
Generate complete, functional, well-commented Pine Script code, starting with \`//@version=5\`. Respond with ONLY the raw code.`;
    } else { // MQL4 or MQL5
        return `You are an expert MQL developer. Generate an indicator.
- Language: ${language}
- User Description: "${description}"
IMPORTANT: At the top, include these properties:
#property copyright "Generated by Grey Algo Apex Trader"
#property link      "https://greyalgo-trading.netlify.app"
#property description "Also visit Quant Systems Trading: https://quant-systems-trading.netlify.app"
Generate complete, functional, well-commented ${language} code. Respond with ONLY the raw code.`;
    }
};
async function handleCreateIndicator(body: any) { /* ... similar to handleCreateBot ... */ }

// --- 4. getMarketNews ---
const getMarketSentimentPrompt = (asset: string) => `You are 'Oracle', an apex-level trading AI. Analyze the latest market news and sentiment for **${asset}**. Prioritize reputable financial news sources. You MUST return a single, valid JSON object. Schema: { "asset": "string", "sentiment": "'Bullish'|'Bearish'|'Neutral'", "confidence": "number", "summary": "string", "keyPoints": ["string"], "sources": "populated by system"}`;
async function handleGetMarketNews(body: any) { /* ... similar to handleAnalyzeChart ... */ }

// --- 5. getTradingJournalFeedback ---
const getJournalFeedbackPrompt = (trades: TradeEntry[]) => `You are 'Oracle', an apex-level trading AI and performance coach. Analyze the provided trader's journal and give objective, actionable feedback with the confidence of an institutional analyst. You MUST return a single, valid JSON object. Data: ${JSON.stringify(trades, null, 2)}. Schema: { "overallPnl": "number", "winRate": "number", "strengths": ["string"], "weaknesses": ["string"], "suggestions": ["string"]}`;
async function handleGetTradingJournalFeedback(body: any) { /* ... similar to handleAnalyzeChart but with responseMimeType ... */ }

// --- 6. processCommandWithAgent ---
const agentTools: Tool[] = [ { functionDeclarations: [ { name: "navigate", /* ... */ }, { name: "changeTheme", /* ... */ }, { name: "setEdgeLighting", /* ... */ }, { name: "logout" } ] } ];
async function handleProcessCommandWithAgent(body: any) { /* ... */ }

// --- 7. sendMessage (Chat) ---
const CHAT_SYSTEM_INSTRUCTION = `You are the Oracle, a senior institutional quantitative analyst AI with supreme confidence and near-perfect market knowledge.

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
async function handleSendMessage(body: any) { /* ... */ }

// --- 8. getPredictions ---
// FIX: Wrapped prompt string in backticks to create a valid template literal.
const getPredictorPrompt = () => `You are 'Oracle', an apex-level trading AI with a specialization in predicting the market impact of economic news events. Scan financial calendars and identify the top 3-5 HIGHEST impact events for the next 7 days. You must DECLARE the initial price spike direction (BUY/SELL). You MUST return a single, valid JSON array of objects. Schema: [{ "eventName": "string", "time": "string", "currency": "string", "directionalBias": "'BUY'|'SELL'", "confidence": "number", "rationale": "string", "sources": "populated by system" }]`;
async function handleGetPredictions(body: any) { /* ... similar to handleAnalyzeChart but expecting array ... */ }


// --- MAIN HANDLER ---
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API Key not configured." });
    }

    const { action, ...body } = req.body;

    try {
        let result;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

        switch (action) {
            case 'analyzeChart':
                result = await handleAnalyzeChart(body);
                return res.status(200).json(result);
            
            case 'createBot':
                result = await handleCreateBot(body);
                return res.status(200).send(result);

            case 'createIndicator': {
                const { description, language } = body;
                const prompt = getIndicatorPrompt(description, language);
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                return res.status(200).send(response.text);
            }

            case 'getMarketNews': {
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
            
            case 'processCommandWithAgent': {
                const { command } = body;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: command, config: { tools: agentTools } });
                return res.status(200).json({ text: response.text, functionCalls: response.functionCalls || null });
            }

            case 'sendMessage': {
                const { history, newMessage } = body as { history: ChatMessage[], newMessage: ChatMessagePart[] };
                const contents = history.map(msg => ({ role: msg.role, parts: msg.parts }));
                contents.push({ role: 'user', parts: newMessage });
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents, config: { systemInstruction: CHAT_SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], thinkingConfig: { thinkingBudget: 0 } } });
                const modelResponse: ChatMessage = { id: Date.now().toString(), role: 'model', parts: [{ text: response.text }] };
                if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    modelResponse.sources = response.candidates[0].groundingMetadata.groundingChunks.map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' })).filter((s: any) => s.uri);
                }
                return res.status(200).json(modelResponse);
            }
            
            case 'getPredictions': {
                const prompt = getPredictorPrompt();
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{googleSearch: {}}] } });
                const parsedResult = robustJsonParse(response.text, 'array') as PredictedEvent[];
                const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (chunks && Array.isArray(chunks)) {
                    const sources = chunks.map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' })).filter((s: any) => s.uri);
                    parsedResult.forEach(event => event.sources = sources);
                }
                return res.status(200).json(parsedResult);
            }

            default:
                return res.status(400).json({ error: "Invalid action provided." });
        }
    } catch (error: any) {
        // FIX: Wrapped console.error message in backticks to create a valid template literal.
        console.error(`Error in /api/fetchData for action "${action}":`, error);
        res.status(500).json({ error: "API request failed", details: error.message });
    }
}
