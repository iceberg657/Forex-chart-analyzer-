
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Landing from './pages/Landing';
import Trader from './pages/Trader';
import Analysis from './pages/Analysis';
import MarketNews from './pages/MarketNews';
import Journal from './pages/Journal';
import History from './pages/History';
import ApexAI from './pages/ApexAI';
import Introduction from './pages/Introduction';
import BotMaker from './pages/BotMaker';
import IndicatorMaker from './pages/IndicatorMaker';
import Pricing from './pages/Pricing';
import Predictor from './pages/Predictor';
import Charting from './pages/Charting';
import TabbedNav from './components/TabbedNav';
import Notifications from './components/Notifications';
import SeasonalRibbon from './components/SeasonalRibbon';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { EdgeLightingProvider } from './hooks/useEdgeLighting';
import ResponsiveFix from './components/ResponsiveFix';
import { AppContextProvider } from './hooks/useAppContext';
import AIAgent from './components/AIAgent';
import { PageDataProvider, usePageData } from './hooks/usePageData';
import { EnvironmentProvider, useEnvironment } from './hooks/useEnvironment';
import ErrorLog from './components/ErrorLog';
import TradingViewWidget from './components/TradingViewWidget';
import SignalOverlay from './components/SignalOverlay';

const App: React.FC = () => {
  return (
    <EnvironmentProvider>
      <AuthProvider>
        <ThemeProvider>
          <EdgeLightingProvider>
            <HashRouter>
              <AppContextProvider>
                <PageDataProvider>
                  <AppContent />
                </PageDataProvider>
              </AppContextProvider>
            </HashRouter>
          </EdgeLightingProvider>
        </ThemeProvider>
      </AuthProvider>
    </EnvironmentProvider>
  );
};

const AppContent: React.FC = () => {
  const environment = useEnvironment();
  const location = useLocation();
  const { isSeasonalModeActive } = usePageData();
  const isChartingPage = location.pathname === '/charting';
  
  // Calculate dynamic top spacing
  // Header height logic: 2.5rem (h-10) for charting, 4rem (h-16) for standard
  const headerHeight = isChartingPage ? 2.5 : 4; 
  const navHeight = 3.5; // rem
  const ribbonHeight = 2.5; // rem
  
  let topSpacingRem = headerHeight;
  
  // Add Nav height only if NOT on charting page
  if (!isChartingPage) {
      topSpacingRem += navHeight;
  }
  
  // Add Ribbon height if active
  if (isSeasonalModeActive) {
      topSpacingRem += ribbonHeight;
  }

  const chartTopSpacing = `${topSpacingRem}rem`;

  useEffect(() => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      splashScreen.style.opacity = '0';
      splashScreen.addEventListener('transitionend', () => splashScreen.remove());
    }
  }, []);

  return (
    <ResponsiveFix>
      <div className="relative isolate flex flex-col h-screen text-gray-800 dark:text-gray-200 font-sans overflow-hidden">
        <SeasonalRibbon />
        <Notifications />
        
        {/* Persistent Chart Container */}
        {/* This keeps the chart mounted but hidden when not on the charting page, preventing reloads/resets. */}
        <div 
          style={{ 
            visibility: isChartingPage ? 'visible' : 'hidden',
            position: 'absolute',
            top: chartTopSpacing, 
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30, // Below Header (z-50) and Nav (z-40)
          }}
          className="bg-gray-100 dark:bg-gray-900 transition-all duration-300 ease-in-out flex flex-col"
        >
          {/* Signal Overlay serves as the Top Toolbar - only renders if active signal exists */}
          <SignalOverlay />
          <div className="flex-1 relative w-full h-full overflow-hidden">
            <TradingViewWidget />
          </div>
        </div>

        <Routes>
          <Route element={<GuestLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Trader />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/market-news" element={<MarketNews />} />
            <Route path="/predictor" element={<Predictor />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/history" element={<History />} />
            <Route path="/apex-ai" element={<ApexAI />} />
            <Route path="/coders" element={<CodersPage />} />
          </Route>

          <Route element={<ProtectedRoute><ChartingLayout /></ProtectedRoute>}>
            <Route path="/charting" element={<Charting />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        {/* Hide AI Agent when on the charting page */}
        {!isChartingPage && <AIAgent />}
        
        {environment === 'aistudio' && <ErrorLog />}
      </div>
    </ResponsiveFix>
  );
};

const GuestLayout: React.FC = () => {
  const { user } = useAuth();
  if (!user.isGuest) {
    return <Navigate to="/dashboard" />;
  }
  return (
    <>
      <Header />
      <div className="flex-grow overflow-y-auto flex flex-col">
        <main className="flex-grow w-full flex flex-col py-4 sm:py-6 lg:py-8">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:py-8 flex-1 flex flex-col justify-center">
            <Outlet />
            </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

const AppLayout: React.FC = () => (
  <>
    <Header />
    <TabbedNav />
    <div className="flex-grow overflow-y-auto flex flex-col relative z-10">
        <main className="flex-grow w-full flex flex-col py-4 sm:py-6 lg:py-8">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:py-8 flex-1 flex flex-col justify-center">
                <Outlet />
            </div>
        </main>
        <Footer />
    </div>
  </>
);

const ChartingLayout: React.FC = () => (
  <>
    <Header />
    {/* Removed TabbedNav for Charting Layout to give more space */}
    <main className="flex-grow w-full relative overflow-hidden pointer-events-none">
        {/* Content here is transparent/empty to let the persistent chart show through */}
        <Outlet />
    </main>
  </>
);

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  return user.isGuest ? <Navigate to="/login" /> : children;
};

const CodersPage: React.FC = () => (
    <div className="space-y-16">
        <section id="coders"><Introduction /></section>
        <section id="bot-maker"><BotMaker /></section>
        <section id="indicator-maker"><IndicatorMaker /></section>
    </div>
);


export default App;
