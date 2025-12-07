import React, { useState } from 'react';
import { usePageData } from '../hooks/usePageData';

const ValueItem: React.FC<{ label: string, value: string, onCopy: () => void, copied: boolean, colorClass: string, disabled?: boolean }> = ({ label, value, onCopy, copied, colorClass, disabled }) => (
    <div 
        onClick={disabled ? undefined : onCopy}
        className={`flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-md transition-colors group border border-white/5 select-none min-w-[100px] ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/20 cursor-pointer'}`}
        title={disabled ? '' : `Click to copy ${label}`}
    >
        <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{label}</span>
        <div className="flex items-center gap-2 ml-auto">
             <span className={`font-mono font-bold text-sm ${colorClass}`}>{value}</span>
             {!disabled && <i className={`fas ${copied ? 'fa-check text-green-500' : 'fa-copy text-gray-600 group-hover:text-gray-400'} text-xs opacity-0 group-hover:opacity-100 transition-opacity`}></i>}
        </div>
    </div>
);

const ToolButton: React.FC<{ icon: string, label: string, active?: boolean, colorClass?: string, onClick?: () => void }> = ({ icon, label, active, colorClass = "text-gray-400 hover:text-white", onClick }) => (
    <button 
        onClick={onClick}
        className={`p-2 rounded-lg border transition-all relative group/btn ${active ? 'bg-white/10 border-white/20 text-white shadow-inner' : 'border-transparent hover:bg-white/5'} ${colorClass}`}
        title={label}
    >
        <i className={`fas ${icon}`}></i>
        {active && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-current rounded-full animate-pulse"></span>}
    </button>
);

const SignalOverlay: React.FC = () => {
  const { pageData } = usePageData();
  // Get the most recent analysis from history
  const latestAnalysis = pageData.analysisHistory.history[0];
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // Helper to handle copy
  const handleCopy = (text: string, label: string) => {
    if (!text || text === '---') return;
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    setTimeout(() => setIsCopied(null), 2000);
  };

  // Determine state based on whether an analysis exists
  const hasAnalysis = !!latestAnalysis;
  
  const asset = hasAnalysis ? latestAnalysis.asset : "No Active Signal";
  const timeframe = hasAnalysis ? latestAnalysis.timeframe : "--";
  const signal = hasAnalysis ? latestAnalysis.signal : "WAITING";
  
  const isBuy = signal === 'BUY';
  const isSell = signal === 'SELL';
  
  const badgeBg = isBuy ? 'bg-green-500/10 text-green-500 border-green-500/20' : isSell ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  const entryDisplay = hasAnalysis && latestAnalysis.entryPriceRange && latestAnalysis.entryPriceRange.length > 0 
    ? latestAnalysis.entryPriceRange[0] 
    : '---';
    
  const stopLossDisplay = hasAnalysis ? latestAnalysis.stopLoss : '---';

  const tpDisplay = hasAnalysis && latestAnalysis.takeProfits
    ? (Array.isArray(latestAnalysis.takeProfits) ? latestAnalysis.takeProfits[0] : latestAnalysis.takeProfits)
    : '---';

  return (
    <div className="w-full bg-[#0C0F1A] border-b border-white/10 flex items-center justify-between px-4 py-2 z-40 gap-4 shadow-md select-none overflow-x-auto no-scrollbar h-[64px]">
        
        {/* Left Group: Asset & Signal */}
        <div className="flex items-center gap-4 flex-shrink-0">
             {/* Signal Badge */}
            <div className={`px-3 py-1.5 rounded border text-xs font-black uppercase tracking-wide flex items-center gap-2 shadow-sm ${badgeBg}`}>
                <i className={`fas ${isBuy ? 'fa-arrow-up' : isSell ? 'fa-arrow-down' : 'fa-minus'}`}></i>
                {signal}
            </div>
            
             {/* Asset Info */}
            <div className="flex flex-col border-l border-white/10 pl-4">
                <span className="text-base font-bold text-white leading-none tracking-tight">{asset}</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{timeframe}</span>
            </div>
        </div>

        {/* Center Group: Actionable Data Points */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5 mx-auto flex-shrink-0">
            <ValueItem 
                label="Entry" 
                value={entryDisplay} 
                onCopy={() => handleCopy(entryDisplay, 'entry')} 
                copied={isCopied === 'entry'} 
                colorClass="text-blue-400"
                disabled={!hasAnalysis}
            />
            <div className="w-px h-6 bg-white/10"></div>
            <ValueItem 
                label="Stop" 
                value={stopLossDisplay} 
                onCopy={() => handleCopy(stopLossDisplay, 'sl')} 
                copied={isCopied === 'sl'} 
                colorClass="text-red-400"
                disabled={!hasAnalysis}
            />
            <div className="w-px h-6 bg-white/10"></div>
            <ValueItem 
                label="Target" 
                value={tpDisplay} 
                onCopy={() => handleCopy(tpDisplay, 'tp')} 
                copied={isCopied === 'tp'} 
                colorClass="text-green-400"
                disabled={!hasAnalysis}
            />
        </div>

        {/* Right Group: Drawing Tools (Visual Helpers) */}
        <div className="flex items-center gap-1 pl-4 border-l border-white/10 flex-shrink-0">
             <span className="text-[9px] text-gray-500 uppercase font-bold mr-2 hidden xl:block">Tools</span>
             
             <ToolButton icon="fa-crosshairs" label="Crosshair" />
             <ToolButton icon="fa-slash" label="Trendline" />
             <ToolButton icon="fa-ruler-vertical" label="Measure" />
             
             <div className="w-px h-4 bg-white/10 mx-1"></div>

             <ToolButton 
                icon="fa-arrow-trend-up" 
                label="Long Position Tool" 
                active={isBuy} 
                colorClass={isBuy ? "text-green-500" : undefined}
                onClick={hasAnalysis ? () => handleCopy(entryDisplay, 'Long Tool Setup') : undefined}
            />
             <ToolButton 
                icon="fa-arrow-trend-down" 
                label="Short Position Tool" 
                active={isSell} 
                colorClass={isSell ? "text-red-500" : undefined}
                onClick={hasAnalysis ? () => handleCopy(entryDisplay, 'Short Tool Setup') : undefined}
            />
        </div>
        
        <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
    </div>
  );
};

export default SignalOverlay;