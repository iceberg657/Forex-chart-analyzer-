
export const processCommandWithAgent = async (command: string): Promise<any> => {
    const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
    });
    
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to process command with agent.');
    }

    return result.data;
};
