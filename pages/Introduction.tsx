import React from 'react';
import { Link } from 'react-router-dom';

const Introduction: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Welcome to the AI Coders Hub</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Harness the power of Gemini AI to build your custom trading tools. Whether you need a fully automated trading bot (Expert Advisor) or a sophisticated indicator, our AI can write the code for you in minutes.
      </p>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-8 hover:border-red-500/80 transition-all transform hover:-translate-y-1">
          <h2 className="text-2xl font-bold text-red-500 mb-4">AI Bot Maker</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Describe your trading strategy, select your parameters, and let our AI generate a complete Expert Advisor in MQL4 or MQL5. Automate your trading without writing a single line of code.
          </p>
          <Link to="/bot-maker" className="inline-block bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
            Create a Bot
          </Link>
        </div>

        <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-8 hover:border-green-500/80 transition-all transform hover:-translate-y-1">
          <h2 className="text-2xl font-bold text-green-500 mb-4">AI Indicator Maker</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Need a custom indicator for MetaTrader or TradingView? Just tell the AI what you want to measure or visualize, and it will generate the necessary code in MQL4, MQL5, or Pine Script.
          </p>
          <Link to="/indicator-maker" className="inline-block bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
            Create an Indicator
          </Link>
        </div>
      </div>

      <div className="mt-12 bg-black/5 dark:bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/20 dark:border-white/10">
        <h3 className="text-xl font-semibold mb-3">How It Works</h3>
        <ol className="list-decimal list-inside text-left space-y-2 text-gray-600 dark:text-gray-300">
            <li>Select whether you want to create a Bot or an Indicator.</li>
            <li>Fill in the form with your desired trading logic, strategies, and platform.</li>
            <li>Be as descriptive as possible about how you want your tool to function.</li>
            <li>Our AI will process your request and generate the source code.</li>
            <li>Copy the code and use it in your trading platform!</li>
        </ol>
      </div>
    </div>
  );
};

export default Introduction;