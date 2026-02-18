import React, { useState, useCallback, DragEvent, useMemo, useEffect } from 'react';
import { useNavigate } from '../hooks/useAppContext';
import { analyzeChart } from '../services/apiClient';
import { TRADING_STYLES } from '../constants';
import CandleStickLoader from '../components/CandleStickLoader';
import { usePageData } from '../hooks/usePageData';
import { AnalysisResult } from '../types';
import Dashboard from '../components/Dashboard';
import { useEnvironment } from '../hooks/useEnvironment';
import NeuralNetworkBackground from '../components/NeuralNetworkBackground';

interface TraderProps {}

const isDateInSeasonalWindow = (date: Date): boolean => {
    const month = date.getMonth(); // 0-11
    return month >= 10 || month === 0; // Nov, Dec, Jan
};

const ChartUploadSlot: React.FC<{
  timeframe: 'higher' | 'primary' | 'entry';
  title: string;
  description: string;
  previewUrl: string | null;
  onFileChange: (file: File, timeframe: string) => void;
  onFileRemove: (timeframe: string) => void;
  isPrimary?: boolean;
  disabled?: boolean;
}> = ({ timeframe, title, description, previewUrl, onFileChange, onFileRemove, isPrimary = false, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = `file-upload-${timeframe}`;

  const handleDrag = (e: DragEvent<HTMLLabelElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(dragging);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    handleDrag(e, false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0], timeframe);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0], timeframe);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-2 tracking-widest">
        {title} {isPrimary && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {previewUrl ? (
          <div className={`relative group ${disabled ? 'opacity-50' : ''}`}>
            <img src={previewUrl} alt={`${title} preview`} className="rounded-2xl w-full h-48 object-cover border border-white/40 dark:border-white/10 shadow-xl" />
            <button
              onClick={() => onFileRemove(timeframe)}
              disabled={disabled}
              className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg disabled:cursor-not-allowed"
              aria-label={`Remove ${title} image`}
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`mt-1 flex justify-center px-6 pt-8 pb-10 border-2 border-dashed rounded-[2rem] transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-500/5' : 'cursor-pointer'} ${isDragging ? 'border-red-500 bg-red-500/10 scale-[0.98]' : 'border-white/30 dark:border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-400/50'}`}
          >
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-500/10 flex items-center justify-center mx-auto mb-2 text-gray-400">
                <i className="fas fa-cloud-upload-alt text-2xl"></i>
              </div>
              <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                <span className={`font-bold ${disabled ? '' : 'text-red-600 dark:text-red-400'}`}>
                  Upload {title}
                </span>
                <input id={inputId} name={inputId} type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleInputChange} disabled={disabled} />
                <p className="text-[10px] mt-1 text-gray-500 dark:text-gray-500 uppercase font-bold tracking-tighter">Drag & Drop or Ctrl+V</p>
              </div>
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

const Trader: React.FC<TraderProps> = () => {
  const [chartFiles, setChartFiles] = useState<{ [key: string]: File | null }>({
    higher: null, primary: null, entry: null
  });
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string | null }>({
    higher: null, primary: null, entry: null
  });
  const [riskReward, setRiskReward] = useState<string>('1:3');
  const [tradingStyle, setTradingStyle] = useState<string>(TRADING_STYLES[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [isSingleChartMode, setIsSingleChartMode] = useState(false);
  const navigate = useNavigate();
  const { pageData, addAnalysisToHistory } = usePageData();
  const environment = useEnvironment();

  const isSeasonalModeActive = useMemo(() => {
    const { seasonalModeSetting } = pageData;
    if (seasonalModeSetting === 'On') return true;
    if (seasonalModeSetting === 'Off') return false;
    return isDateInSeasonalWindow(new Date());
  }, [pageData.seasonalModeSetting]);

  const handleFileChange = useCallback((file: File, timeframe: string) => {
    setChartFiles(prev => ({ ...prev, [timeframe]: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrls(prev => ({ ...prev, [timeframe]: reader.result as string }));
    };
    reader.readAsDataURL(file);
    setError(null);
  }, []);

  const handleFileRemove = useCallback((timeframe: string) => {
    setChartFiles(prev => ({ ...prev, [timeframe]: null }));
    setPreviewUrls(prev => ({ ...prev, [timeframe]: null }));
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();

              if (isSingleChartMode) {
                 handleFileChange(file, 'primary');
              } else {
                 if (!chartFiles.primary) handleFileChange(file, 'primary');
                 else if (!chartFiles.higher) handleFileChange(file, 'higher');
                 else if (!chartFiles.entry) handleFileChange(file, 'entry');
                 else handleFileChange(file, 'primary'); 
              }
              return;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [chartFiles, isSingleChartMode, handleFileChange]);


  const toggleMode = () => {
    setIsSingleChartMode(prev => {
        const newModeIsSingle = !prev;
        if (newModeIsSingle) {
            handleFileRemove('higher');
            handleFileRemove('entry');
        }
        return newModeIsSingle;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!chartFiles.primary) {
      setError('Please upload a chart for analysis.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setRetryMessage(null);

    const onRetryAttempt = (attempt: number, maxRetries: number) => {
        setRetryMessage(`AI service is busy. Retrying... (${attempt}/${maxRetries - 1})`);
    };

    try {
      const analysisResult = await analyzeChart(
        chartFiles, 
        riskReward, 
        tradingStyle, 
        isSeasonalModeActive,
        onRetryAttempt
      );
      const resultWithMeta: AnalysisResult = {
        ...analysisResult,
        id: new Date().toISOString(),
        date: new Date().toLocaleString(),
      };
      addAnalysisToHistory(resultWithMeta);
      navigate('/analysis', { state: { result: resultWithMeta } });
    } catch (err) {
      console.error("Analysis submission failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setRetryMessage(null);
    }
  }, [chartFiles, riskReward, tradingStyle, isSeasonalModeActive, navigate, addAnalysisToHistory]);
  
  const riskRewardOptions = ['1:1', '1:2', '1:3', '1:4', '1:5'];
  const isAnalyzeDisabled = isLoading || !chartFiles.primary;

  const selectClassName = "mt-1 block w-full pl-4 pr-10 py-3 text-base bg-white/5 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 rounded-2xl text-gray-900 dark:text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none";

  return (
    <div className="space-y-12 relative">
      <NeuralNetworkBackground />
      <div className="relative z-10 space-y-12">
        {isLoading && <CandleStickLoader statusMessage={retryMessage} />}
        <Dashboard />
        <div className="max-w-5xl mx-auto w-full px-2">
            <div className="bg-white/30 dark:bg-black/40 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[3rem] shadow-2xl p-8 space-y-10 animate-fade-in">
            
            {/* Mode Switcher */}
            <div className="flex flex-col items-center space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Oracle Analyzer</h2>
                <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button 
                        onClick={() => !isSingleChartMode || toggleMode()}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isSingleChartMode ? 'bg-white dark:bg-white/10 text-red-600 shadow-lg' : 'text-gray-500'}`}
                    >
                        Multi-TF
                    </button>
                    <button 
                        onClick={() => isSingleChartMode || toggleMode()}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isSingleChartMode ? 'bg-white dark:bg-white/10 text-red-600 shadow-lg' : 'text-gray-500'}`}
                    >
                        Single Chart
                    </button>
                </div>
            </div>

            {/* Upload Section */}
            <div className="space-y-6">
                {!isSingleChartMode ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ChartUploadSlot
                    timeframe="higher"
                    title="Macro TF"
                    description="4H / Daily"
                    previewUrl={previewUrls.higher}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                    />
                    <ChartUploadSlot
                    timeframe="primary"
                    title="Main TF"
                    description="H1 / M15"
                    previewUrl={previewUrls.primary}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                    isPrimary
                    />
                    <ChartUploadSlot
                    timeframe="entry"
                    title="Execution TF"
                    description="M15 / M5"
                    previewUrl={previewUrls.entry}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                    />
                </div>
                ) : (
                <div className="max-w-md mx-auto w-full">
                    <ChartUploadSlot
                    timeframe="primary"
                    title="Technical Snapshot"
                    description="Required"
                    previewUrl={previewUrls.primary}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                    isPrimary
                    />
                </div>
                )}
            </div>
            
            {/* Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-[2.5rem] bg-black/5 dark:bg-white/5 border border-white/10">
                <div className="relative">
                <label className="block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1 tracking-widest ml-1">Trading Strategy</label>
                <select value={tradingStyle} onChange={e => setTradingStyle(e.target.value)} className={selectClassName}>
                    {TRADING_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                </select>
                <div className="absolute right-4 bottom-3.5 pointer-events-none text-gray-400">
                    <i className="fas fa-chevron-down text-xs"></i>
                </div>
                </div>
                <div className="relative">
                <label className="block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1 tracking-widest ml-1">Risk Profile</label>
                <select value={riskReward} onChange={e => setRiskReward(e.target.value)} className={selectClassName}>
                    {riskRewardOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <div className="absolute right-4 bottom-3.5 pointer-events-none text-gray-400">
                    <i className="fas fa-chevron-down text-xs"></i>
                </div>
                </div>
            </div>

            {/* Pro-Tip Box */}
            <div className="bg-blue-600/10 dark:bg-blue-500/5 p-5 rounded-3xl border border-blue-500/20 flex items-start gap-4 shadow-inner backdrop-blur-md">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <i className="fas fa-lightbulb"></i>
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    <strong className="text-blue-600 dark:text-blue-400 uppercase tracking-tighter block mb-1">Precision Protocol</strong>
                    Include RSI, EMAs, or OBV in your capture. The Oracle cross-references these for institutional confluence verification.
                </div>
            </div>

            {/* Execution Button */}
            <div className="space-y-4 pt-4">
                {error && (
                <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-xs font-bold uppercase tracking-widest animate-shake">
                    <div className="flex flex-col items-center gap-2">
                        <span><i className="fas fa-exclamation-triangle mr-2"></i> {error}</span>
                        {(error.toLowerCase().includes('permission denied') || error.toLowerCase().includes('api key')) && environment === 'aistudio' && (
                            <button 
                                onClick={() => (window as any).aistudio?.openSelectKey()}
                                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg"
                            >
                                Select Paid API Key
                            </button>
                        )}
                    </div>
                </div>
                )}
                <button 
                    onClick={handleSubmit} 
                    disabled={isAnalyzeDisabled} 
                    className="w-full relative group overflow-hidden py-5 bg-gradient-to-r from-red-600 to-rose-700 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-red-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center justify-center gap-3">
                        {isLoading ? (
                            <>
                                <i className="fas fa-circle-notch animate-spin"></i>
                                Processing Neural Data...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-bolt"></i>
                                Initiate Analysis
                            </>
                        )}
                    </span>
                </button>
            </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default Trader;
