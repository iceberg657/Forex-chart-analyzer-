

import { apiPost } from './api';

export const processCommandWithAgent = async (command: string): Promise<any> => {
    const result = await apiPost('/api/agent', { command });
    return result.data;
};
