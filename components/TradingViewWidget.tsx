
import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '../hooks/useTheme';

const TradingViewWidget: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (container.current) {
        container.current.innerHTML = '';
        
        const widgetDiv = document.createElement("div");
        widgetDiv.className = "tradingview-widget-container__widget";
        widgetDiv.style.height = "100%";
        widgetDiv.style.width = "100%";
        container.current.appendChild(widgetDiv);

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
          "autosize": true,
          "symbol": "FX:EURUSD",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": theme,
          "style": "1",
          "locale": "en",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "hide_side_toolbar": false,
          "calendar": false,
          "support_host": "https://www.tradingview.com"
        });
        container.current.appendChild(script);
    }
  }, [theme]); 

  return (
    <div 
        className="tradingview-widget-container w-full h-full overflow-hidden" 
        ref={container} 
    >
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
};

export default memo(TradingViewWidget);
