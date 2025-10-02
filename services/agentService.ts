
export const processCommandWithAgent = async (command: string): Promise<any> => {
    const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
    });
    
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Server returned an unreadable error');
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `Server error: ${response.status}`);
        } catch (e) {
            throw new Error(errorText || `Server error: ${response.status}`);
        }
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || 'Failed to process command with agent.');
    }

    return result.data;
};
