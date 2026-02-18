import React, { useState } from 'react';
import { usePageData } from '../hooks/usePageData';
import { UserSettings } from '../types';
import AIAgent from '../components/AIAgent';

const Settings: React.FC = () => {
    const { pageData, updateUserSettings } = usePageData();
    const [settings, setSettings] = useState<UserSettings>(pageData.userSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

    const handleSave = () => {
        setIsSaving(true);
        updateUserSettings(settings);
        
        // Simulate sync delay for effect
        setTimeout(() => {
            setIsSaving(false);
            setSaveStatus('success');
            // Revert status after a moment
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 800);
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-10 animate-fade-in">
            <div className="text-center">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Preferences</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Configure your trading account for precise AI alignment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Account Configuration */}
                <div className="bg-white/20 dark:bg-black/40 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <i className="fas fa-wallet text-xl"></i>
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Account Setup</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 tracking-widest">Account Type</label>
                            <div className="grid grid-cols-2 gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
                                {['Live Account', 'Funded Account'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSettings(s => ({ ...s, accountType: type as any }))}
                                        className={`py-2.5 rounded-xl text-xs font-bold transition-all ${settings.accountType === type ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-white/10 text-gray-500'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 tracking-widest">Balance ($)</label>
                            <input
                                type="number"
                                value={settings.balance}
                                onChange={e => setSettings(s => ({ ...s, balance: parseFloat(e.target.value) || 0 }))}
                                className="w-full bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-red-500/30 rounded-2xl p-4 text-lg font-bold"
                                placeholder="e.g. 50000"
                            />
                        </div>

                        {settings.accountType === 'Funded Account' && (
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 tracking-widest">Trading Days</label>
                                <input
                                    type="number"
                                    value={settings.tradingDays || 30}
                                    onChange={e => setSettings(s => ({ ...s, tradingDays: parseFloat(e.target.value) || 0 }))}
                                    className="w-full bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-red-500/30 rounded-2xl p-4 text-lg font-bold"
                                    placeholder="e.g. 30"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 tracking-widest">Target %</label>
                                <input
                                    type="number"
                                    value={settings.targetPercent}
                                    onChange={e => setSettings(s => ({ ...s, targetPercent: parseFloat(e.target.value) || 0 }))}
                                    className="w-full bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-red-500/30 rounded-xl p-3 text-center font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 tracking-widest">Daily DD %</label>
                                <input
                                    type="number"
                                    value={settings.dailyDrawdown}
                                    onChange={e => setSettings(s => ({ ...s, dailyDrawdown: parseFloat(e.target.value) || 0 }))}
                                    className="w-full bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-red-500/30 rounded-xl p-3 text-center font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 tracking-widest">Max DD %</label>
                                <input
                                    type="number"
                                    value={settings.maxDrawdown}
                                    onChange={e => setSettings(s => ({ ...s, maxDrawdown: parseFloat(e.target.value) || 0 }))}
                                    className="w-full bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-red-500/30 rounded-xl p-3 text-center font-bold"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving || saveStatus === 'success'}
                            className={`w-full py-4 mt-4 font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 ${saveStatus === 'success' ? 'bg-green-600 text-white shadow-green-500/20' : 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-red-500/20'}`}
                        >
                            {isSaving ? 'Syncing Neural Data...' : saveStatus === 'success' ? 'Completed' : 'Complete & Synchronize'}
                        </button>
                    </div>
                </div>

                {/* AI Assistant Integration */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mb-2">
                             <i className="fas fa-robot text-4xl"></i>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">System Assistant</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed font-medium">
                            Need help configuring your account or navigating the app? Access your neural commander here.
                        </p>
                        
                        <div className="pt-4 w-full">
                            <AIAgent inline />
                        </div>
                    </div>
                </div>
            </div>
            
            <p className="text-center text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] opacity-40">
                Institutional Alignment Protocol v4.0.1
            </p>
        </div>
    );
};

export default Settings;