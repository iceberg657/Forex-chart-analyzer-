
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import TabbedNav from './components/TabbedNav';
import Notifications from './components/Notifications';
import SeasonalRibbon from './components/SeasonalRibbon';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { EdgeLightingProvider } from './hooks/useEdgeLighting';
import ResponsiveFix from './components/ResponsiveFix';
import { AppContextProvider } from './hooks/useAppContext';
import AIAgent from './components/AIAgent';
import { PageDataProvider } from './hooks/usePageData';
import { EnvironmentProvider, useEnvironment } from './hooks/useEnvironment';
import ErrorLog from './components/ErrorLog';

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
  
  useEffect(() => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      splashScreen.style.opacity = '0';
      splashScreen.addEventListener('transitionend', () => splashScreen.remove());
    }
  }, []);

  return (
    <ResponsiveFix>
      <div className="relative isolate flex flex-col min-h-screen text-gray-800 dark:text-gray-200 font-sans overflow-x-hidden">
        <SeasonalRibbon />
        <Notifications />
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
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <AIAgent />
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
      <main className="flex-grow w-full flex flex-col py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:py-8 flex-1 flex flex-col justify-center">
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  );
};

const AppLayout: React.FC = () => (
  <>
    <Header />
    <TabbedNav />
    <main className="flex-grow w-full flex flex-col py-4 sm:py-6 lg:py-8">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:py-8 flex-1 flex flex-col justify-center">
        <Outlet />
      </div>
    </main>
    <Footer />
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
