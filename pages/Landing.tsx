
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NeuralNetworkBackground from '../components/NeuralNetworkBackground';

const FeatureCard: React.FC<{ icon: string | React.ReactNode; title: string; children: React.ReactNode; delay?: string }> = ({ icon, title, children, delay = "0s" }) => (
    <div className="group relative bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-8 text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] dark:hover:shadow-[0_0_30px_rgba(56,189,248,0.2)] animate-fade-in-up" style={{ animationDelay: delay }}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent dark:from-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
        <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 shadow-inner">
                {typeof icon === 'string' ? (
                    <i className={`${icon} text-3xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 dark:from-cyan-400 dark:to-blue-500`}></i>
                ) : (
                    <div className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 dark:from-cyan-400 dark:to-blue-500 flex items-center justify-center [&>svg]:w-9 [&>svg]:h-9 [&>svg]:fill-current">
                        {icon}
                    </div>
                )}
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-cyan-400 transition-colors">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{children}</p>
        </div>
    </div>
);

const TradingViewIcon = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.25 10V18H14.75V10H17.25ZM10.75 4V18H13.25V4H10.75ZM4.25 14V18H6.75V14H4.25Z" />
    </svg>
);

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const handleGetStarted = () => navigate('/signup');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="relative min-h-screen">
            <NeuralNetworkBackground />
            
            {/* Main Content Container - Relative to sit above background */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 space-y-32">
                
                {/* Hero Section */}
                <section className={`text-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-none">
                        <span className="block text-gray-900 dark:text-white drop-shadow-sm">Quantum Edge</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-red-600 dark:from-cyan-400 dark:via-blue-500 dark:to-purple-500 animate-gradient-x pb-4">
                            Trading Intelligence
                        </span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 text-gray-600 dark:text-slate-300 font-light leading-relaxed">
                        Decode market chaos with institutional-grade AI. <br className="hidden md:block"/>
                        Generate bots, predict events, and execute with precision.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-5">
                        <button 
                            onClick={handleGetStarted} 
                            className="group relative px-8 py-4 bg-red-600 text-white font-bold rounded-xl overflow-hidden shadow-lg shadow-red-500/30 transition-all hover:scale-105 hover:shadow-red-500/50"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                            <span className="relative flex items-center gap-2">
                                Start Trading Free <i className="fas fa-arrow-right"></i>
                            </span>
                        </button>
                        <a 
                            href="#features" 
                            className="px-8 py-4 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                        >
                            Explore Logic
                        </a>
                    </div>
                </section>
                
                {/* Features Grid */}
                <section id="features" className="relative">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Neural Processing Suite</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            Our platform utilizes a multi-modal approach, combining the speed of Nano Banana models for real-time inference with the generative depth of Veo 3 for complex pattern recognition.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard icon="fas fa-brain" title="Neural Chart Vision" delay="0s">
                            Upload raw chart data. Our vision models decompose price action into liquidity zones, order blocks, and high-probability entry vectors instantly.
                        </FeatureCard>
                        <FeatureCard icon="fas fa-code-branch" title="Generative Coding" delay="0.1s">
                            Turn natural language into executable code. Build sophisticated MQL5 bots and Pine Script indicators without writing a single line of syntax.
                        </FeatureCard>
                        <FeatureCard icon="fas fa-globe-americas" title="Global Sentiment Grid" delay="0.2s">
                            Real-time ingestion of global news and economic data. We parse thousands of sources to give you a definitive bullish or bearish bias.
                        </FeatureCard>
                        <FeatureCard icon="fas fa-bolt" title="Event Horizon Predictor" delay="0.3s">
                            Anticipate volatility before it happens. Our Oracle engine forecasts high-impact economic events with startling accuracy.
                        </FeatureCard>
                        <FeatureCard icon="fas fa-book-journal-whills" title="AI Performance Coach" delay="0.4s">
                            Your personal trading psychologist. The AI analyzes your journal to identify behavioral leaks and optimize your win rate.
                        </FeatureCard>
                        <FeatureCard icon={<TradingViewIcon />} title="Advanced Charting" delay="0.5s">
                            Powered by <span className="font-bold">TradingView</span>. Access institutional-grade technical analysis tools integrated directly into your workflow.
                        </FeatureCard>
                        <FeatureCard icon="fas fa-layer-group" title="Seasonal Adjustments" delay="0.6s">
                            Adaptive algorithms that automatically shift strategies based on market conditions (e.g., low-liquidity holiday modes).
                        </FeatureCard>
                    </div>
                </section>

                {/* Workflow Section */}
                <section className="relative bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-red-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">The Apex Workflow</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent z-0"></div>

                        {[
                            { step: '01', title: 'Input Data', desc: 'Upload charts or ask complex queries.' },
                            { step: '02', title: 'Neural Crunch', desc: 'Gemini 2.5 Flash processes patterns.' },
                            { step: '03', title: 'Execution', desc: 'Receive signals, code, or forecasts.' }
                        ].map((item, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center mb-6 transform transition-transform hover:scale-110 hover:rotate-3">
                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-purple-600">{item.step}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center pb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Ready to ascend?</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Join the elite traders leveraging the power of Grey Algo.</p>
                    <button 
                        onClick={handleGetStarted} 
                        className="px-10 py-4 bg-red-600 text-white font-bold rounded-full shadow-lg shadow-red-500/40 hover:bg-red-700 hover:shadow-red-500/60 transition-all transform hover:-translate-y-1"
                    >
                        Create Free Account
                    </button>
                </section>
            </div>
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }
                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
};

export default Landing;
