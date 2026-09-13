import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { authAPI } from './services/api';

// Pages
import { WelcomePage } from './pages/WelcomePage';
import { SetupPage } from './pages/SetupPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { SensorDetailPage } from './pages/SensorDetailPage';
import { DeviceManager } from './pages/DeviceManager';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPanel } from './pages/AdminPanel';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { HardwareDiagnosticsPage } from './pages/HardwareDiagnosticsPage';

// Layout Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AIFieldChat } from './components/AIFieldChat';

export const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Validate JWT on start to maintain session persistence
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('agrihub_token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (err) {
          console.error('Session validation failed:', err);
          localStorage.removeItem('agrihub_token');
        }
      }
      setInitializing(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('agrihub_token');
    setUser(null);
    navigate('/login');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">
        <span className="w-8 h-8 rounded-full border-2 border-farm-500 border-t-transparent animate-spin mb-4"></span>
        <span>Validating credentials...</span>
      </div>
    );
  }

  // Unauthenticated Layout Router
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<SignupPage onSignupSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated Layout Router
  return (
    <div className="flex min-h-screen bg-[#041007]">
      {/* Responsive Sidebar for desktop */}
      <Sidebar userRole={user.role} />

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>
          {/* Menu */}
          <div className="relative w-64 bg-slate-950 border-r border-slate-900/60 p-4 h-full flex flex-col justify-between">
            <Sidebar userRole={user.role} />
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main content view */}
      <div className="flex-1 flex flex-col overflow-hidden max-h-screen">
        <Navbar 
          userName={user.name} 
          onLogout={handleLogout} 
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto flex">
          <Routes>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/sensor/:id" element={<SensorDetailPage />} />
            <Route path="/devices" element={<DeviceManager />} />
            <Route path="/hardware-diagnostics" element={<HardwareDiagnosticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {user.role === 'ADMIN' && <Route path="/admin" element={<AdminPanel />} />}
            
            {/* Fallback route redirection */}
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating Windmill AI Chatbot active across all pages */}
      <AIFieldChat />
    </div>
  );
};
