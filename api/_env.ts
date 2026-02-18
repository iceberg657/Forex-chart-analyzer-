// This helper function reads all environment variables starting with "API_KEY_"
// and returns them as an array of strings, sorted numerically.
function getAllApiKeys(): string[] {
    const allKeys: string[] = [];
    let i = 1;
    // Loop to find all API_KEY_n variables until one is not found.
    while (process.env[`API_KEY_${i}`]) {
        const key = process.env[`API_KEY_${i}`];
        if (key) {
           allKeys.push(key);
        }
        i++;
    }
    
    if (allKeys.length === 0) {
        console.warn('CRITICAL: No API_KEY_n environment variables found. The application will not be able to make API calls.');
    }
    
    return allKeys;
}

const ALL_KEYS = getAllApiKeys();

// --- Resilient API Key Laning Strategy ---
// Attempt to distribute keys into dedicated pools.
const dedicatedAnalysisKeys = ALL_KEYS.slice(0, 3);
const dedicatedDashboardKeys = ALL_KEYS.slice(3, 5);
const dedicatedChatKeys = ALL_KEYS.slice(5, 7);

// If a dedicated pool is empty (because not enough keys were provided),
// it falls back to using the ENTIRE pool of available keys. This ensures
// no service lane ever tries to operate with an empty key array, preventing crashes.
export const ANALYSIS_KEYS = dedicatedAnalysisKeys.length > 0 ? dedicatedAnalysisKeys : ALL_KEYS;
export const DASHBOARD_KEYS = dedicatedDashboardKeys.length > 0 ? dedicatedDashboardKeys : ALL_KEYS;
export const CHAT_KEYS = dedicatedChatKeys.length > 0 ? dedicatedChatKeys : ALL_KEYS;

// Log the distribution for debugging purposes during deployment.
console.log(`[API Key Service] Initialized. Total keys found: ${ALL_KEYS.length}. Distribution: Analysis(${ANALYSIS_KEYS.length}), Dashboard(${DASHBOARD_KEYS.length}), Chat(${CHAT_KEYS.length})`);


// --- Model Fallback Chains ---
// Define the model fallback chain in order of preference for standard calls.
export const MODEL_FALLBACK_CHAIN = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-lite', 
];

// Define the model fallback chain for streaming calls.
export const STREAM_MODEL_FALLBACK_CHAIN = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-lite',
];
