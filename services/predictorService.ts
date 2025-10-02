

import { PredictedEvent } from '../types';
import { apiPost } from './api';

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    const result = await apiPost('/api/predictions', {});
    return result.data as PredictedEvent[];
};
