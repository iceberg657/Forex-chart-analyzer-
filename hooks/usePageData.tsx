
import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { PredictedEvent, MarketSentimentResult, ChatMessage, AnalysisResult, DashboardOverview, SeasonalModeSetting, AppNotification, UserSettings } from '../types';
import { useLocation } from './useAppContext';
import { useEdgeLighting } from './useEdgeLighting';

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
    seasonalModeSetting: SeasonalModeSetting;
    notifications: AppNotification[];
    userSettings: UserSettings;
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
    setSeasonalModeSetting: (setting: SeasonalModeSetting) => void;
    dismissNotification: (id: string) => void;
    updateUserSettings: (settings: UserSettings) => void;
    isSeasonalModeActive: boolean;
}

const PageDataContext = createContext<PageDataContextType | undefined>(undefined);

const defaultUserSettings: UserSettings = {
    accountType: 'Live Account',
    balance: 1000,
    targetPercent: 5,
    dailyDrawdown: 3,
    maxDrawdown: 10,
    tradingDays: 30
};

const initialState: PageDataState = {
    dashboard: { overview: null, error: null },
    predictor: { events: null, error: null },
    marketNews: { result: null, asset: '', error: null },
    apexAI: { messages: [] },
    analysisHistory: { history: [] },
    seasonalModeSetting: 'Auto',
    notifications: [],
    userSettings: defaultUserSettings
};

const isDateInSeasonalWindow = (date: Date): boolean => {
    const month = date.getMonth();
    return month >= 10 || month === 0;
};

export const PageDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pageData, setPageData] = useState<PageDataState>(() => {
        let history: AnalysisResult[] = [];
        let dashboardData = { overview: null, error: null };
        let seasonalSetting: SeasonalModeSetting = 'Auto';
        let userSettings = defaultUserSettings;
        
        try {
            const savedHistory = localStorage.getItem('analysisHistory');
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                if (Array.isArray(parsedHistory)) {
                    history = parsedHistory;
                }
            }
            
            const savedDashboard = localStorage.getItem('dashboardOverview');
            if (savedDashboard) {
                const parsed = JSON.parse(savedDashboard);
                if (parsed && typeof parsed === 'object') {
                    // Relaxed validation: Check for basic fields to ensure it restores even if AI output is slightly partial
                    const isSchemaValid = 
                        parsed.dailyBiases && 
                        Array.isArray(parsed.dailyBiases) &&
                        parsed.marketCondition;

                    if (parsed.lastUpdated && (Date.now() - parsed.lastUpdated < 3600000) && isSchemaValid) {
                        dashboardData = { overview: parsed, error: null };
                    }
                }
            }

            const savedSetting = localStorage.getItem('seasonalModeSetting');
            if (savedSetting === 'Auto' || savedSetting === 'On' || savedSetting === 'Off') {
                seasonalSetting = savedSetting;
            }

            const savedUserSettings = localStorage.getItem('userSettings');
            if (savedUserSettings) {
                userSettings = JSON.parse(savedUserSettings);
            }

        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
        }
        return { ...initialState, analysisHistory: { history }, dashboard: dashboardData, seasonalModeSetting: seasonalSetting, userSettings };
    });

    const isSeasonalModeActive = useMemo(() => {
        const { seasonalModeSetting } = pageData;
        if (seasonalModeSetting === 'On') return true;
        if (seasonalModeSetting === 'Off') return false;
        return isDateInSeasonalWindow(new Date());
    }, [pageData.seasonalModeSetting]);

    const location = useLocation();
    const { setEdgeLight } = useEdgeLighting();

    useEffect(() => {
        document.body.classList.toggle('seasonal-active', isSeasonalModeActive);
        if (isSeasonalModeActive) {
            if (location.pathname !== '/analysis') {
                setEdgeLight('green');
            }
        } else {
            // Default edge lighting handled in components/Analysis.tsx or left as default (blue)
        }
    }, [isSeasonalModeActive, setEdgeLight, location.pathname]);

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

    const setSeasonalModeSetting = (setting: SeasonalModeSetting) => {
        localStorage.setItem('seasonalModeSetting', setting);
        setPageData(prev => ({ ...prev, seasonalModeSetting: setting }));
    };

    const dismissNotification = (id: string) => {
        setPageData(prev => ({
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== id)
        }));
    };

    const updateUserSettings = (settings: UserSettings) => {
        localStorage.setItem('userSettings', JSON.stringify(settings));
        setPageData(prev => ({ ...prev, userSettings: settings }));
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
        setSeasonalModeSetting,
        dismissNotification,
        updateUserSettings,
        isSeasonalModeActive,
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
