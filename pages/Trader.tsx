
import React, { useState, useCallback } from 'react';
import { AnalysisResult, GroundingSource } from '../types';
import { analyzeChart } from '../services/geminiService';
import Spinner from '../components/Spinner';
import { TRADING_STYLES } from '../constants';

const SourcesCard: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sources</h3>
      <div className="bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg">
        <ul className="space-y-2">
          {sources.map((source, index) => (
            <li key={index} className="flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path></svg>
              <a 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                title={source.title}
              >
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};


const Trader: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [riskReward, setRiskReward] = useState('1:2');
  const [tradingStyle, setTradingStyle] = useState('Day Trading');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload a chart image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeChart(imageFile, riskReward, tradingStyle);
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, riskReward, tradingStyle]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Chart Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Upload your chart screenshot and let our AI provide a detailed trade setup.</p>
      </div>

      <div className="max-w-4xl mx-auto bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg p-8 space-y-6">
        <div>
          <label htmlFor="chart-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Chart Screenshot</label>
          <div className="input-gradient-border mt-1 rounded-md">
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800/80">
                <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-500 dark:text-gray-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-200 dark:bg-gray-700 rounded-md font-medium text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 dark:focus-within:ring-offset-gray-900 focus-within:ring-red-500 px-1">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
            </div>
          </div>
        </div>
        {previewUrl && <img src={previewUrl} alt="Chart preview" className="mx-auto max-h-96 rounded-lg"/>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="input-gradient-border rounded-md">
              <label htmlFor="trading-style" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sr-only">Trading Style</label>
              <select id="trading-style" value={tradingStyle} onChange={(e) => setTradingStyle(e.target.value)} className="form-element mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 sm:text-sm rounded-md text-gray-900 dark:text-white">
                <option disabled>Trading Style</option>
                {TRADING_STYLES.map(style => <option key={style}>{style}</option>)}
              </select>
            </div>
            <div className="input-gradient-border rounded-md">
              <label htmlFor="risk-reward" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sr-only">Risk/Reward Ratio</label>
              <select id="risk-reward" value={riskReward} onChange={(e) => setRiskReward(e.target.value)} className="form-element mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 sm:text-sm rounded-md text-gray-900 dark:text-white">
                <option disabled>Risk/Reward Ratio</option>
                <option>1:1</option>
                <option>1:2</option>
                <option>1:3</option>
                <option>1:5</option>
              </select>
            </div>
        </div>

        <button onClick={handleAnalyze} disabled={isLoading || !imageFile} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white btn-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus-ring-offset-gray-900 focus:ring-red-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
          {isLoading ? 'Analyzing...' : 'Analyze Chart'}
        </button>
      </div>

      {isLoading && <Spinner />}
      {error && <div className="text-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg max-w-4xl mx-auto">{error}</div>}
      
      {analysis && (
        <div className="max-w-4xl mx-auto bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg p-8 mt-8 animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Analysis for {analysis.asset} ({analysis.timeframe})</h2>

            <div className={`p-6 rounded-lg text-white text-center shadow-lg ${analysis.signal === 'BUY' ? 'bg-green-600' : 'bg-red-600'}`}>
                <p className="text-sm uppercase tracking-wider font-semibold">Signal</p>
                <p className="text-5xl font-bold my-2">{analysis.signal}</p>
                <div className="mt-4">
                    <p className="text-xs uppercase tracking-wider font-semibold">Confidence</p>
                    <div className="w-full bg-white/30 rounded-full h-2.5 my-1">
                        <div className="bg-white h-2.5 rounded-full" style={{ width: `${analysis.confidence}%` }}></div>
                    </div>
                    <p className="text-xl font-bold">{analysis.confidence}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Entry</p>
                <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">{analysis.entry}</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">Stop Loss</p>
                <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">{analysis.stopLoss}</p>
              </div>
               <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">Take Profit(s)</p>
                <div className="flex flex-col">
                  {analysis.takeProfits.map((tp, index) => (
                    <p key={index} className="text-lg font-mono font-semibold text-gray-900 dark:text-white">{tp}</p>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Main Reasoning</h3>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg">{analysis.reasoning}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">10 Supporting Reasons</h3>
              <div className="bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg">
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  {analysis.tenReasons.map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-lg leading-tight">{reason.split(' ')[0]}</span>
                      <span>{reason.substring(reason.indexOf(' ') + 1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <SourcesCard sources={analysis.sources || []} />
        </div>
      )}
    </div>
  );
};

export default Trader;
