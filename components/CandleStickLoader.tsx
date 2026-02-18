import React, { useState, useEffect } from 'react';

const analysisSteps = [
  "Scanning Market Structure...",
  "Detecting Liquidity Zones...",
  "Applying Quantum Heuristics...",
  "Cross-referencing Volatility...",
  "Finalizing Institutional Thesis...",
  "Compiling A+ Setup...",
];

interface CandleStickLoaderProps {
  statusMessage?: string | null;
}

const CandleStickLoader: React.FC<CandleStickLoaderProps> = ({ statusMessage }) => {
  const [currentStep, setCurrentStep] = useState(analysisSteps[0]);

  useEffect(() => {
    if (statusMessage) return; // Don't cycle internal messages if an external one is provided

    const intervalId = setInterval(() => {
      setCurrentStep(prevStep => {
        const currentIndex = analysisSteps.indexOf(prevStep);
        const nextIndex = (currentIndex + 1) % analysisSteps.length;
        return analysisSteps[nextIndex];
      });
    }, 1800); 

    return () => clearInterval(intervalId);
  }, [statusMessage]);

  const displayedMessage = statusMessage || currentStep;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
      <div className="candlestick-loader">
        <div className="candle">
          <div className="wick"></div>
          <div className="body"></div>
        </div>
        <div className="candle">
          <div className="wick"></div>
          <div className="body"></div>
        </div>
        <div className="candle">
          <div className="wick"></div>
          <div className="body"></div>
        </div>
        <div className="candle">
          <div className="wick"></div>
          <div className="body"></div>
        </div>
        <div className="candle">
          <div className="wick"></div>
          <div className="body"></div>
        </div>
      </div>
      <p className="text-white text-xl mt-8 font-semibold animate-pulse">Executing Flash Analysis...</p>
      <p className="text-gray-300 mt-2 h-6 transition-opacity duration-500 ease-in-out">{displayedMessage}</p>
    </div>
  );
};

export default CandleStickLoader;
