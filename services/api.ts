
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 500) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503 || response.status === 429) { // Service Unavailable or Too Many Requests
        if (i === retries - 1) {
            // After last retry, we'll let the handleApiError throw a more user-friendly error.
            return response;
        }
        const delay = backoff * Math.pow(2, i) + Math.random() * 100; // Add jitter
        console.warn(`API server busy (status ${response.status}). Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return response; // Success or other error to be handled by handleApiError
      }
    } catch (error) {
      if (i === retries - 1) throw error; // Rethrow last error if all retries fail
      const delay = backoff * Math.pow(2, i) + Math.random() * 100; // Add jitter
      console.warn(`Network error. Retrying in ${Math.round(delay)}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Request failed after multiple retries.");
};


const handleApiError = async (response: Response) => {
    const errorText = await response.text().catch(() => 'Server returned an unreadable error');

    if (response.status === 503 || response.status === 429) {
        throw new Error("The AI model is currently busy or overloaded. Please wait a moment and try again.");
    }
    
    let errorMessage = `An unexpected error occurred. Status: ${response.status}`;
    try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
            let nestedMessage = errorJson.message;
            if (typeof nestedMessage === 'string') {
                try {
                    // Attempt to parse if it's stringified JSON
                    const nestedJson = JSON.parse(nestedMessage);
                    if (nestedJson.error && nestedJson.error.message) {
                        errorMessage = nestedJson.error.message;
                    } else if (nestedJson.message) {
                        errorMessage = nestedJson.message;
                    } else {
                        errorMessage = nestedMessage;
                    }
                } catch (e) {
                    // It's not a JSON string, so use it as is
                    errorMessage = nestedMessage;
                }
            } else if (typeof nestedMessage === 'object' && nestedMessage !== null && nestedMessage.message) {
                 errorMessage = nestedMessage.message;
            }
        }
    } catch (e) {
         // The errorText was not JSON or did not have a .message property
         errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
};

/**
 * A centralized API post function that includes retry logic and improved error handling.
 * @param endpoint The API endpoint to call (e.g., '/api/analyze').
 * @param body The request body object.
 * @returns The JSON response from the API on success.
 */
export const apiPost = async (endpoint: string, body: object): Promise<any> => {
    const response = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response || !response.ok) {
        await handleApiError(response);
    }
    
    const result = await response.json();

    if (result.success === false) { // Explicitly check for success: false
        throw new Error(result.message || 'The API returned a non-successful response.');
    }

    return result; // Return the whole result object
};
