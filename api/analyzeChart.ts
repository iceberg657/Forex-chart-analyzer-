/*
 * DEPRECATED: This server-side API endpoint is no longer in use.
 * The application has been updated to use the client-side Gemini SDK directly
 * in /services/geminiService.ts to ensure it works when downloaded or run locally.
 * This file can be safely removed.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Allow', 'POST');
  res.status(410).json({
    error: 'This API endpoint is deprecated. The application now uses a client-side implementation.',
  });
}
