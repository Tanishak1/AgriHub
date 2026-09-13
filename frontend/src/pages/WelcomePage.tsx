import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const WelcomePage: React.FC = () => {
  const { t } = useLanguage();
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const navigate = useNavigate();

  const loadingStages = [
    { pct: 15, text: 'Mapping field nodes...' },
    { pct: 40, text: 'Opening bridge channel...' },
    { pct: 70, text: 'Fetching climate patterns...' },
    { pct: 90, text: 'Booting AI agronomist...' },
    { pct: 100, text: 'System ready.' },
  ];

  useEffect(() => {
    setLoadingText(loadingStages[0].text);
    
    const interval = setInterval(() => {
      setLoadingPercent((prev) => {
        const next = prev + 1;
        
        // Update helper text based on percentage boundaries
        const stage = loadingStages.find((s) => next <= s.pct);
        if (stage) setLoadingText(stage.text);

        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 25); // ~2.5s total load time

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-farm-800/10 blur-3xl animate-pulse-soft"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-soil-800/10 blur-3xl animate-pulse-soft delay-1000"></div>

      {/* Main Container */}
      <div className="w-full max-w-md text-center z-10 flex flex-col items-center">
        {/* Animated Brand Logo */}
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-farm-700 to-farm-400 flex items-center justify-center text-5xl shadow-glow-green mb-8 relative border border-farm-500/20 group">
          <span className="group-hover:scale-110 transition-transform duration-300">🌱</span>
          <div className="absolute -inset-2 rounded-3xl border border-farm-500/20 animate-spin-slow opacity-60"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2 font-sans bg-clip-text bg-gradient-to-r from-white via-farm-100 to-farm-400">
          {t('app.name')}
        </h1>
        <p className="text-sm font-medium text-farm-400 uppercase tracking-widest mb-12">
          {t('app.tagline')}
        </p>

        {/* Loading / Action Section */}
        <div className="w-full px-6">
          {loadingPercent < 100 ? (
            <div className="space-y-4">
              {/* Progress Bar Container */}
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                <div
                  className="h-full bg-gradient-to-r from-farm-500 to-farm-300 rounded-full transition-all duration-300 ease-out shadow-glow-green"
                  style={{ width: `${loadingPercent}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>{loadingText}</span>
                <span className="text-farm-400 font-mono">{loadingPercent}%</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/setup')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-farm-600 to-farm-500 hover:from-farm-500 hover:to-farm-400 text-white font-bold text-sm tracking-widest uppercase transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-glow-green border border-farm-400/20 animate-fadeIn"
            >
              {t('welcome.enter')}
            </button>
          )}
        </div>
      </div>

      {/* Subtle bottom indicator */}
      <div className="absolute bottom-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
        Hardware Ready • ESP32 Serial Supported
      </div>
    </div>
  );
};
