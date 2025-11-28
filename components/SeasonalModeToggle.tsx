
import React from 'react';
import { usePageData } from '../hooks/usePageData';
import { SeasonalModeSetting } from '../types';

const isDateInSeasonalWindow = (date: Date): boolean => {
    const month = date.getMonth(); // 0-11
    // November (10), December (11), January (0)
    return month >= 10 || month === 0;
};

const SeasonalModeToggle: React.FC = () => {
    const { pageData, setSeasonalModeSetting } = usePageData();
    const { seasonalModeSetting } = pageData;

    const today = new Date();
    const isAutoSeasonal = isDateInSeasonalWindow(today);
    const isSeasonalModeActive = seasonalModeSetting === 'On' || (seasonalModeSetting === 'Auto' && isAutoSeasonal);

    const options: { value: SeasonalModeSetting, label: string }[] = [
        { value: 'Auto', label: 'Auto' },
        { value: 'On', label: 'On' },
        { value: 'Off', label: 'Off' },
    ];

    const getStatusInfo = () => {
        if (isSeasonalModeActive) {
            return { text: 'Active', color: 'text-green-500', pulse: 'pulse' };
        }
        return { text: 'Inactive', color: 'text-red-500', pulse: 'pulse-red' };
    };

    const status = getStatusInfo();

    return (
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                 <i className="fas fa-snowflake text-xl text-blue-500"></i>
                <div>
                    <h3 className="font-bold text-sm">Seasonal Mode</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className={`w-2 h-2 rounded-full ${status.pulse.replace('pulse', 'bg-green-500').replace('-red', ' bg-red-500')}`}></div>
                        <span>Status: <span className={`font-semibold ${status.color}`}>{status.text}</span> {seasonalModeSetting === 'Auto' && '(Auto)'}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center p-1 bg-gray-500/10 dark:bg-gray-900/40 rounded-lg">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setSeasonalModeSetting(opt.value)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${seasonalModeSetting === opt.value ? 'bg-red-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SeasonalModeToggle;
