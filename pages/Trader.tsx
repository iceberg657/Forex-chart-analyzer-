
import React, { useState, useCallback, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeChart } from '../services/geminiService';
import { TRADING_STYLES } from '../constants';
import Dashboard from '../components/Dashboard';
import CandleStickLoader from '../components/CandleStickLoader';

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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {title} {isPrimary && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {previewUrl ? (
          <div className={`relative group ${disabled ? 'opacity-50' : ''}`}>
            <img src={previewUrl} alt={`${title} preview`} className="rounded-md w-full h-48 object-cover border-2 border-white/30 dark:border-white/10" />
            <button
              onClick={() => onFileRemove(timeframe)}
              disabled={disabled}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
              aria-label={`Remove ${title} image`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-500/5' : 'cursor-pointer'} ${isDragging ? 'border-red-500 bg-red-500/10' : 'border-gray-400/50 dark:border-gray-500/50 hover:border-red-400/80'}`}
          >
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <span className={`relative bg-transparent rounded-md font-medium ${disabled ? '' : 'text-red-600 dark:text-red-500 hover:text-red-500'}`}>
                  Click to upload
                </span>
                <input id={inputId} name={inputId} type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleInputChange} disabled={disabled} />
                <p className="pl-1">or drag & drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">{description}</p>
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

const Trader: React.FC = () => {
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
  const navigate = useNavigate();

  const handleFileChange = (file: File, timeframe: string) => {
    setChartFiles(prev => ({ ...prev, [timeframe]: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrls(prev => ({ ...prev, [timeframe]: reader.result as string }));
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleFileRemove = (timeframe: string) => {
    setChartFiles(prev => ({ ...prev, [timeframe]: null }));
    setPreviewUrls(prev => ({ ...prev, [timeframe]: null }));
  };

  const handleSubmit = useCallback(async () => {
    if (!chartFiles.primary) {
      setError('Please upload at least the Primary Timeframe chart.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const analysisResult = await analyzeChart(chartFiles, riskReward, tradingStyle);
      navigate('/analysis', { state: { result: analysisResult } });
    } catch (err) {
      console.error("Analysis submission failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      navigate('/analysis', { state: { error: errorMessage } });
    } finally {
      setIsLoading(false);
    }
  }, [chartFiles, riskReward, tradingStyle, navigate]);
  
  const riskRewardOptions = ['1:1', '1:2', '1:3', '1:4', '1:5'];
  const isAnalyzeDisabled = isLoading || !chartFiles.primary;

  return (
    <div>
      {isLoading && <CandleStickLoader />}
      <Dashboard />
      <div className="max-w-3xl mx-auto mt-12">
        <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">1. Upload Charts for Top-Down Analysis</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Provide charts from different timeframes for the most accurate analysis.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ChartUploadSlot
                timeframe="higher"
                title="Higher Timeframe"
                description="Optional (e.g., 4H, 1D)"
                previewUrl={previewUrls.higher}
                onFileChange={handleFileChange}
                onFileRemove={handleFileRemove}
              />
              <ChartUploadSlot
                timeframe="primary"
                title="Primary Timeframe"
                description="Required (e.g., 1H, 15m)"
                previewUrl={previewUrls.primary}
                onFileChange={handleFileChange}
                onFileRemove={handleFileRemove}
                isPrimary
              />
              <ChartUploadSlot
                timeframe="entry"
                title="Entry Timeframe"
                description="Optional (e.g., 15m, 5m)"
                previewUrl={previewUrls.entry}
                onFileChange={handleFileChange}
                onFileRemove={handleFileRemove}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="trading-style" className="block text-sm font-medium text-gray-700 dark:text-gray-300">2. Trading Style</label>
              <select id="trading-style" value={tradingStyle} onChange={e => setTradingStyle(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:ring-red-500/50 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                {TRADING_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="risk-reward" className="block text-sm font-medium text-gray-700 dark:text-gray-300">3. Risk/Reward Ratio</label>
              <select id="risk-reward" value={riskReward} onChange={e => setRiskReward(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:ring-red-500/50 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                {riskRewardOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="text-center text-red-700 dark:text-red-400 bg-red-500/10 p-3 rounded-lg text-sm">{error}</div>}
          <button onClick={handleSubmit} disabled={isAnalyzeDisabled} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-red-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
            {isLoading ? 'Analyzing...' : 'Analyze Chart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Trader;