import { PredictedEvent } from '../types';
import { apiClient } from './apiClient';

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    return apiClient.post<PredictedEvent[]>('getPredictions', {});
};
