import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Trader from './pages/Trader';
import Introduction from './pages/Introduction';
import BotMaker from './pages/BotMaker';
import IndicatorMaker from './pages/IndicatorMaker';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Analysis from './pages/Analysis';
import MarketNews from './pages/MarketNews';
import Journal from './pages/Journal';
import Landing from './pages/Landing'; // Import Landing page
import ApexAI from './pages/ApexAI'; // Import Apex AI page
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { EdgeLightingProvider } from './hooks/useEdgeLighting';
import ResponsiveFix from './components/ResponsiveFix';
import { AppContextProvider } from './hooks/useAppContext';
import AIAgent from './components/AIAgent';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <EdgeLightingProvider>
          <HashRouter>
            <AppContextProvider>
              <AppContent />
            </AppContextProvider>
          </HashRouter>
        </EdgeLightingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isApexAiPage = location.pathname === '/apex-ai';

  return (
    <ResponsiveFix>
      <div className="relative isolate flex flex-col min-h-screen text-gray-800 dark:text-gray-200 font-sans overflow-x-hidden">
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <Header />
        <main className={`flex-grow w-full flex flex-col ${isApexAiPage ? '' : 'py-8'}`}>
          <AppRoutes />
        </main>
        <Footer />
        <AIAgent />
      </div>
    </ResponsiveFix>
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  return (
      <Routes>
        <Route path="/login" element={user.isGuest ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={user.isGuest ? <SignUp /> : <Navigate to="/dashboard" />} />
        
        {user.isGuest ? (
          <Route path="/" element={<Landing />} />
        ) : (
          <>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Trader />} />
          </>
        )}
        
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/introduction" element={<Introduction />} />
        <Route path="/bot-maker" element={<BotMaker />} />
        <Route path="/indicator-maker" element={<IndicatorMaker />} />
        <Route path="/market-news" element={<MarketNews />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/apex-ai" element={<ApexAI />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
};

export default App;