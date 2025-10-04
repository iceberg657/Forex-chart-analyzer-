
/**
 * ARCHITECTURE OVERVIEW: DUAL-MODE API CALLS
 *
 * This application is designed to run in two distinct environments:
 * 1. Google AI Studio (Development): For rapid development and testing.
 * 2. Deployed Website/PWA (Production): For public use.
 *
 * To accommodate both, the app uses an environment-aware API service (`services/unifiedApiService.ts`).
 *
 * --- In AI Studio ---
 * The service detects the AI Studio environment (where `process.env.API_KEY` is available client-side)
 * and makes direct, client-side calls to the Gemini API using the `@google/genai` library.
 * This is simple, fast, and ideal for development.
 *
 * --- On a Deployed Website ---
 * On a live website, the client-side API key is not available for security reasons.
 * The service detects this and switches to "proxy mode". In this mode, it makes `fetch` requests
 * to the serverless functions located in this `/api` directory (e.g., `/api/analyze`, `/api/chat`).
 *
 * These serverless functions act as a secure backend proxy. They run in a Node.js environment,
 * receive the request from the client, securely attach the secret `API_KEY` (stored as an
 * environment variable on the server), call the Gemini API, and then forward the response back to the client.
 *
 * This dual-mode approach provides the best of both worlds: the simplicity of direct API calls
 * in development and the security of a backend proxy in production.
 */

// This file is for documentation purposes only. The actual proxy logic is implemented
// as individual serverless functions (e.g., analyze.ts, chat.ts) within this directory.
