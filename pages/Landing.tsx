import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PRICING_PLANS } from '../constants';
import { PricingPlan } from '../types';
import { useAuth } from '../hooks/useAuth';

const FeatureCard: React.FC<{ icon: string; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-white/5 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-6 text-center transform hover:-translate-y-2 transition-transform duration-300">
        <div className="text-red-500 dark:text-red-400 text-4xl mb-4 inline-block">
            <i className={icon}></i>
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{children}</p>
    </div>
);

const PricingCard: React.FC<{ plan: PricingPlan; onGetStarted: () => void; }> = ({ plan, onGetStarted }) => {
    const CheckIcon: React.FC = () => (
        <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
    );

  return (
    <div className={`rounded-2xl p-8 flex flex-col transition-all shadow-lg ${plan.isFeatured ? 'bg-red-500/5 dark:bg-red-900/10 backdrop-blur-xl border-red-500/50 scale-105 border' : 'bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10 border'}`}>
      <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">{plan.name}</h3>
      <div className="mt-4 text-center text-gray-600 dark:text-gray-300">
        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
        {plan.price !== "$0" && <span className="text-base font-medium">/month</span>}
      </div>
      <ul className="mt-8 space-y-4">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <div className="flex-shrink-0"><CheckIcon /></div>
            <p className="ml-3 text-base text-gray-600 dark:text-gray-300">{feature}</p>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">
        <button 
          onClick={onGetStarted}
          className={`w-full block text-center py-3 px-4 rounded-md font-medium transition-colors ${plan.isFeatured ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/30 dark:bg-white/10 hover:bg-white/40 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200'}`}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};


const Landing: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleGetStarted = () => {
        login('trader@apex.com');
        navigate('/dashboard');
    };

    return (
        <div className="space-y-24 md:space-y-32">
            {/* Hero Section */}
            <section className="text-center pt-16 md:pt-24">
                <h1 className="text-4xl lg:text-6xl font-extrabold mb-4 tracking-tight">
                    <span className="block text-gray-900 dark:text-white">Trade Smarter, Not Harder with</span>
                    <span className="block animated-gradient-text mt-2">AI-Powered Analysis</span>
                </h1>
                <p className="text-lg max-w-3xl mx-auto my-6 text-gray-600 dark:text-slate-300">
                    Leverage institutional-grade AI to analyze market charts, generate custom trading bots, and gain an unbeatable edge. Welcome to the future of trading.
                </p>
                <div className="flex justify-center gap-4 mt-8">
                    <button onClick={handleGetStarted} className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105">
                        Get Started Free
                    </button>
                    <a href="#features" className="bg-white/20 dark:bg-black/20 backdrop-blur-lg border border-white/30 dark:border-white/10 text-gray-800 dark:text-gray-200 font-bold py-3 px-8 rounded-lg hover:bg-white/40 dark:hover:bg-black/30 transition-colors">
                        Learn More
                    </a>
                </div>
            </section>
            
            {/* Features Section */}
            <section id="features" className="text-center">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Your Ultimate Trading Toolkit</h2>
                <p className="text-lg max-w-2xl mx-auto mb-12 text-gray-600 dark:text-slate-400">
                    Everything you need to elevate your trading, powered by the Gemini API.
                </p>
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard icon="fas fa-chart-line" title="AI Chart Analysis">
                        Upload any chart image and receive an institutional-grade analysis, complete with entry, stop-loss, and take-profit levels.
                    </FeatureCard>
                    <FeatureCard icon="fas fa-robot" title="AI Bot & Indicator Coders">
                        Describe your strategy in plain English and our AI will generate ready-to-use code for MetaTrader (MQL4/5) or TradingView (Pine Script).
                    </FeatureCard>
                    <FeatureCard icon="fas fa-newspaper" title="AI Market Sentiment">
                        Get real-time sentiment analysis and news summaries for any asset, ensuring you're always trading with the latest information.
                    </FeatureCard>
                </div>
            </section>

            {/* How It Works Section */}
            <section>
                 <div className="text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Get Started in 3 Simple Steps</h2>
                    <p className="text-lg max-w-2xl mx-auto mb-12 text-gray-600 dark:text-slate-400">
                        From chart to code, we've streamlined the process.
                    </p>
                </div>
                <div className="relative">
                    {/* Decorative line */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-300 dark:bg-gray-700 -translate-y-1/2"></div>
                    
                    <div className="relative grid md:grid-cols-3 gap-12">
                        <div className="text-center">
                             <div className="relative inline-block">
                                <div className="w-20 h-20 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-2xl font-bold text-red-500 border-2 border-red-500/50 mb-4">1</div>
                             </div>
                            <h3 className="text-xl font-bold mb-2">Upload or Describe</h3>
                            <p className="text-gray-600 dark:text-gray-400">Upload your chart for analysis, or describe the bot/indicator you want to build.</p>
                        </div>
                        <div className="text-center">
                            <div className="relative inline-block">
                                <div className="w-20 h-20 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-2xl font-bold text-red-500 border-2 border-red-500/50 mb-4">2</div>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Let AI Work Its Magic</h3>
                            <p className="text-gray-600 dark:text-gray-400">Our advanced AI model analyzes your input, synthesizes data, and prepares your result.</p>
                        </div>
                        <div className="text-center">
                            <div className="relative inline-block">
                                <div className="w-20 h-20 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-2xl font-bold text-red-500 border-2 border-red-500/50 mb-4">3</div>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Execute Your Edge</h3>
                            <p className="text-gray-600 dark:text-gray-400">Receive actionable trade setups or copy-paste your custom code directly into your platform.</p>
                        </div>
                    </div>
                </div>
            </section>

             {/* Pricing Section */}
            <section id="pricing">
                <div className="text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h2>
                    <p className="text-lg max-w-2xl mx-auto mt-4 mb-12 text-gray-600 dark:text-slate-400">Unlock your full trading potential with the right plan.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PRICING_PLANS.map((plan) => (
                    <PricingCard key={plan.name} plan={plan} onGetStarted={handleGetStarted} />
                    ))}
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="text-center bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-2xl p-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Ready to Revolutionize Your Trading?</h2>
                <p className="text-lg mt-4 mb-8 max-w-xl mx-auto text-gray-600 dark:text-slate-300">
                    Join today and gain immediate access to our powerful suite of AI trading tools. Your free account is just a click away.
                </p>
                <button onClick={handleGetStarted} className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105 inline-block">
                    Sign Up Now
                </button>
            </section>
        </div>
    );
};

export default Landing;