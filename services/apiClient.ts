

import { detectEnvironment } from '../hooks/useEnvironment';

const environment = detectEnvironment();

/**
 * Determines the base URL for API calls based on the execution environment.
 * In AI Studio (iframe), it uses an absolute URL to prevent resolution issues.
 * For website/PWA, it uses relative paths.
 */
const getApiBaseUrl = (): string => {
    if (environment === 'aistudio') {
        // When running in an iframe like AI Studio, relative paths can be unreliable.
        // Constructing an absolute URL from the window's origin is a safer approach.
        return window.location.origin;
    }
    // For standard website and PWA contexts, relative paths are sufficient and standard.
    return ''; 
};

const API_BASE = getApiBaseUrl();

/**
 * A centralized client for making POST requests to the backend API.
 * It handles JSON body conversion, response parsing, and error handling.
 */
export const apiClient = {
    post: async <T>(action: string, body: object): Promise<T> => {
        const url = `${API_BASE}/api/fetchData`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...body }),
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                throw new Error(response.statusText || `Request failed with status ${response.status}`);
            }
            throw new Error(errorData.error || errorData.details || `API request for action ${action} failed.`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json() as Promise<T>;
        } else {
            // Handles non-JSON responses like plain text for generated code.
            return response.text() as unknown as Promise<T>;
        }
    }
};