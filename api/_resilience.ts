// FIX: Replaced non-exported `GenerateContentStreamResult` with `AsyncIterable<GenerateContentResponse>`.
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { MODEL_FALLBACK_CHAIN, STREAM_MODEL_FALLBACK_CHAIN } from './_env.js';

// This function makes a resilient API call, handling key rotation and model fallbacks.
export async function makeResilientCall(
    apiKeys: string[],
    requestPayload: any,
    isStreaming: false
): Promise<GenerateContentResponse>;
export async function makeResilientCall(
    apiKeys: string[],
    requestPayload: any,
    isStreaming: true
): Promise<AsyncIterable<GenerateContentResponse>>;

export async function makeResilientCall(
    apiKeys: string[],
    requestPayload: any,
    isStreaming: boolean
): Promise<GenerateContentResponse | AsyncIterable<GenerateContentResponse>> {

    if (apiKeys.length === 0) {
        throw new Error('No API keys provided for this service lane.');
    }

    const modelsToTry = isStreaming ? STREAM_MODEL_FALLBACK_CHAIN : MODEL_FALLBACK_CHAIN;
    let lastError: Error | null = null;

    // Outer loop: Iterate through the fallback models
    for (const model of modelsToTry) {
        // Inner loop: Iterate through the API keys for the current lane
        for (const apiKey of apiKeys) {
            try {
                const ai = new GoogleGenAI({ apiKey });
                console.log(`Attempting call with model: ${model} and key ending in ...${apiKey.slice(-4)}`);

                const payloadWithModel = { ...requestPayload, model };
                
                if (isStreaming) {
                    return await ai.models.generateContentStream(payloadWithModel);
                } else {
                    return await ai.models.generateContent(payloadWithModel);
                }

            } catch (error: any) {
                lastError = error;
                const errorMessage = (error.message || '').toLowerCase();
                
                // If it's a quota error (429), we continue to the next key.
                if (errorMessage.includes('429') || errorMessage.includes('quota')) {
                    console.warn(`Quota exceeded for key ...${apiKey.slice(-4)} on model ${model}. Rotating key.`);
                    continue; // Try the next key
                }
                
                // For other errors (e.g., model not available, invalid request),
                // it's often better to try the next model immediately.
                console.error(`API call failed for model ${model} with key ...${apiKey.slice(-4)}: ${error.message}. Trying next model.`);
                break; // Break inner loop (keys) and try next model
            }
        }
    }

    // If all models and keys have failed, throw the last captured error.
    console.error("All API keys and fallback models failed.");
    throw lastError || new Error("An unknown error occurred after all retries.");
}
