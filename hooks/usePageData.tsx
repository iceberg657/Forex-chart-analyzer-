
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { PredictedEvent, MarketSentimentResult, ChatMessage, AnalysisResult, DashboardOverview } from '../types';

interface PageDataState {
    dashboard: {
        overview: DashboardOverview | null;
        error: string | null;
    };
    predictor: {
        events: PredictedEvent[] | null;
        error: string | null;
    };
    marketNews: {
        result: MarketSentimentResult | null;
        asset: string;
        error: string | null;
    };
    apexAI: {
        messages: ChatMessage[];
    };
    analysisHistory: {
        history: AnalysisResult[];
    };
}

interface PageDataContextType {
    pageData: PageDataState;
    setDashboardData: (data: { overview: DashboardOverview | null; error: string | null; }) => void;
    setPredictorData: (data: { events: PredictedEvent[] | null; error: string | null; }) => void;
    setMarketNewsData: (data: { result: MarketSentimentResult | null; asset: string; error: string | null; }) => void;
    setApexAIMessages: (messages: ChatMessage[] | ((prevMessages: ChatMessage[]) => ChatMessage[])) => void;
    clearApexChat: () => void;
    addAnalysisToHistory: (result: AnalysisResult) => void;
    clearAnalysisHistory: () => void;
}

const PageDataContext = createContext<PageDataContextType | undefined>(undefined);

const initialState: PageDataState = {
    dashboard: { overview: null, error: null },
    predictor: { events: null, error: null },
    marketNews: { result: null, asset: '', error: null },
    apexAI: { messages: [] },
    analysisHistory: { history: [] },
};

export const PageDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pageData, setPageData] = useState<PageDataState>(() => {
        let history: AnalysisResult[] = [];
        let dashboardData = { overview: null, error: null };
        
        try {
            const savedHistory = localStorage.getItem('analysisHistory');
            if (savedHistory) {
                history = JSON.parse(savedHistory);
            }
            
            const savedDashboard = localStorage.getItem('dashboardOverview');
            if (savedDashboard) {
                const parsed = JSON.parse(savedDashboard);
                // Check if data is older than 1 hour (3600000 ms)
                if (Date.now() - parsed.lastUpdated < 3600000) {
                    dashboardData = { overview: parsed, error: null };
                }
            }
        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
        }
        return { ...initialState, analysisHistory: { history }, dashboard: dashboardData };
    });

    const setDashboardData = (data: { overview: DashboardOverview | null; error: string | null; }) => {
        if (data.overview) {
            localStorage.setItem('dashboardOverview', JSON.stringify(data.overview));
        }
        setPageData(prev => ({ ...prev, dashboard: data }));
    };

    const setPredictorData = (data: { events: PredictedEvent[] | null; error: string | null; }) => {
        setPageData(prev => ({ ...prev, predictor: data }));
    };

    const setMarketNewsData = (data: { result: MarketSentimentResult | null; asset: string; error: string | null; }) => {
        setPageData(prev => ({ ...prev, marketNews: data }));
    };

    const setApexAIMessages = (messages: ChatMessage[] | ((prevMessages: ChatMessage[]) => ChatMessage[])) => {
        setPageData(prev => {
            const newMessages = typeof messages === 'function' ? messages(prev.apexAI.messages) : messages;
            return {
                ...prev,
                apexAI: { ...prev.apexAI, messages: newMessages },
            };
        });
    };
    
    const clearApexChat = () => {
        setPageData(prev => ({ ...prev, apexAI: { messages: [] } }));
    };

    const addAnalysisToHistory = (result: AnalysisResult) => {
        setPageData(prev => {
            const newHistory = [result, ...prev.analysisHistory.history];
            try {
                localStorage.setItem('analysisHistory', JSON.stringify(newHistory));
            } catch (error) {
                console.error("Failed to save analysis history to localStorage", error);
            }
            return { ...prev, analysisHistory: { history: newHistory } };
        });
    };

    const clearAnalysisHistory = () => {
        try {
            localStorage.removeItem('analysisHistory');
        } catch (error) {
            console.error("Failed to remove analysis history from localStorage", error);
        }
        setPageData(prev => ({ ...prev, analysisHistory: { history: [] } }));
    };

    const value = {
        pageData,
        setDashboardData,
        setPredictorData,
        setMarketNewsData,
        setApexAIMessages,
        clearApexChat,
        addAnalysisToHistory,
        clearAnalysisHistory,
    };

    return (
        <PageDataContext.Provider value={value}>
            {children}
        </PageDataContext.Provider>
    );
};

export const usePageData = (): PageDataContextType => {
    const context = useContext(PageDataContext);
    if (!context) {
        throw new Error('usePageData must be used within a PageDataProvider');
    }
    return context;
};
