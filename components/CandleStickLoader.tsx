import React from 'react';

const CandleStickLoader: React.FC = () => {
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
      <p className="text-white text-xl mt-8 font-semibold animate-pulse">Analyzing Market Data...</p>
      <p className="text-gray-300 mt-2">Running institutional-grade analysis.</p>
    </div>
  );
};

export default CandleStickLoader;
