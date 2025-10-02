import { apiClient } from './apiClient';

export const processCommandWithAgent = async (command: string): Promise<any> => {
    return apiClient.post('processCommandWithAgent', { command });
};
