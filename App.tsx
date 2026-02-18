
import React, { useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate, Outlet, useLocation } from './hooks/useAppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Landing from './pages/Landing';
import Trader from './pages/Trader';
import Analysis from './pages/Analysis';
import History from './pages/History';
import ApexAI from './pages/ApexAI';
import Introduction from './pages/Introduction';
import BotMaker from './pages/BotMaker';
import IndicatorMaker from './pages/IndicatorMaker';
import Predictor from './pages/Predictor';
import Charting from './pages/Charting';
import Settings from './pages/Settings';
import TabbedNav from './components/TabbedNav';
import Notifications from './components/Notifications';
import SeasonalRibbon from './components/SeasonalRibbon';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { EdgeLightingProvider } from './hooks/useEdgeLighting';
import ResponsiveFix from './components/ResponsiveFix';
import { AppContextProvider } from './hooks/useAppContext';
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
            <MemoryRouter>
              <AppContextProvider>
                <PageDataProvider>
                  <AppContent />
                </PageDataProvider>
              </AppContextProvider>
            </MemoryRouter>
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
  
  const headerHeight = isChartingPage ? 2.5 : 4; 
  const navHeight = 3.5;
  const ribbonHeight = 2.5;
  const isDashboard = location.pathname === '/dashboard';

  let topSpacingRem = headerHeight;
  if (isDashboard) topSpacingRem += navHeight;
  if (isSeasonalModeActive) topSpacingRem += ribbonHeight;

  const chartTopSpacing = `${topSpacingRem}rem`;

  useEffect(() => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      splashScreen.style.opacity = '0';
      splashScreen.addEventListener('transitionend', () => splashScreen.remove());
    }
  }, []);

  useEffect(() => {
    if (isChartingPage) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isChartingPage]);

  return (
    <ResponsiveFix>
      <div className="relative isolate flex flex-col h-screen text-gray-800 dark:text-gray-200 font-sans overflow-hidden">
        <SeasonalRibbon />
        <Notifications />
        
        <div 
          style={{ 
            visibility: isChartingPage ? 'visible' : 'hidden',
            position: 'fixed',
            top: chartTopSpacing, 
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
          }}
          className="bg-gray-100 dark:bg-gray-900 flex flex-col pointer-events-auto"
        >
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
            <Route path="/predictor" element={<Predictor />} />
            <Route path="/history" element={<History />} />
            <Route path="/apex-ai" element={<ApexAI />} />
            <Route path="/coders" element={<CodersPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route element={<ProtectedRoute><ChartingLayout /></ProtectedRoute>}>
            <Route path="/charting" element={<Charting />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        {/* Floating AIAgent removed from dashboard, moved to Settings page */}
        
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
        <main className="flex-grow w-full flex flex-col">
            <div className="w-full flex-1 flex flex-col justify-center">
            <Outlet />
            </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isLanding = location.pathname === '/';
  
  return (
    <>
      <Header />
      {isDashboard && <TabbedNav />}
      <div className="flex-grow overflow-hidden flex flex-col relative z-10">
          <main className="flex-grow w-full flex flex-col overflow-y-auto">
              <div className={`w-full h-full ${isDashboard ? 'max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6' : 'px-0 py-0'} flex-1 flex flex-col`}>
                  <Outlet />
              </div>
              {(isDashboard || isLanding) && <Footer />}
          </main>
      </div>
    </>
  );
};

const ChartingLayout: React.FC = () => (
  <>
    <Header />
    <main className="flex-grow w-full relative overflow-hidden pointer-events-none">
        <Outlet />
    </main>
  </>
);

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  return user.isGuest ? <Navigate to="/login" /> : children;
};

const CodersPage: React.FC = () => (
    <div className="space-y-16 px-4 py-8 max-w-7xl mx-auto">
        <section id="coders"><Introduction /></section>
        <section id="bot-maker"><BotMaker /></section>
        <section id="indicator-maker"><IndicatorMaker /></section>
    </div>
);

export default App;
