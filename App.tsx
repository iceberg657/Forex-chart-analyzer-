
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="relative isolate flex flex-col min-h-screen text-gray-800 dark:text-gray-200 font-sans">
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  return (
      <Routes>
        <Route path="/login" element={user.isGuest ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={user.isGuest ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/" element={<Trader />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/introduction" element={<Introduction />} />
        <Route path="/bot-maker" element={<BotMaker />} />
        <Route path="/indicator-maker" element={<IndicatorMaker />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
};

export default App;
