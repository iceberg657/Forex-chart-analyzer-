

import { ChatMessage, ChatMessagePart } from "../types";
import { apiPost } from './api';

export const fileToImagePart = async (file: File): Promise<ChatMessagePart> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

    return {
        inlineData: {
            mimeType: file.type,
            data: base64Data,
        },
    };
};

export const sendMessage = async (history: ChatMessage[], newMessage: ChatMessagePart[]): Promise<ChatMessage> => {
    const result = await apiPost('/api/chat', { history, newMessage });
    return result.data as ChatMessage;
};
