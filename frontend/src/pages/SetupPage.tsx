import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, HelpCircle, Wrench, ArrowRight, Droplets, Thermometer, CloudRain, Volume2, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AIFieldChat } from '../components/AIFieldChat';

export const SetupPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<number>(1);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
      {/* Background blobs */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-farm-900/10 blur-3xl animate-pulse-soft"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-soil-900/10 blur-3xl animate-pulse-soft"></div>

      <div className="w-full max-w-4xl z-10 my-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-wide">{t('setup.title')}</h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold">{t('app.tagline')}</p>
        </div>

        {/* Tab Controls (1, 2, 3 Navigation) */}
        <div className="flex border-b border-slate-800 mb-8 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800/60 max-w-xl mx-auto">
          {[1, 2, 3].map((num) => {
            const labelKey = `setup.tab${num}`;
            const isActive = activeTab === num;
            return (
              <button
                key={num}
                onClick={() => setActiveTab(num)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-farm-600 text-white shadow-glow-green' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t(labelKey).split(' ')[0]} {t(labelKey).split(' ').slice(1).join(' ')}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="glass-panel border border-slate-800/80 rounded-3xl p-8 mb-8 min-h-[360px] flex flex-col justify-between">
          
          {/* Tab 1: About AgriHub */}
          {activeTab === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center space-x-3 text-farm-400">
                <Info className="w-6 h-6" />
                <h2 className="text-xl font-bold text-white">{t('setup.tab1.title')}</h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {t('setup.tab1.body')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                  <h3 className="font-semibold text-xs text-farm-300 uppercase tracking-wider mb-2">🌿 Crop Optimization</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uses physical soil moisture and humidity limits to control irrigation, preventing water wastage while maintaining yield health.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                  <h3 className="font-semibold text-xs text-farm-300 uppercase tracking-wider mb-2">🧠 AI Agronomy Advisory</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Processes telemetry through warning algorithms to trigger local voice advisories in Hindi and English.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Infrastructure Flow */}
          {activeTab === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center space-x-3 text-farm-400">
                <HelpCircle className="w-6 h-6" />
                <h2 className="text-xl font-bold text-white">{t('setup.tab2.title')}</h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {t('setup.tab2.body')}
              </p>
              
              {/* Architecture Graphic Mockup */}
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-850 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center font-bold text-[11px] uppercase tracking-wider">
                <div className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 border border-slate-700/40">
                  🌾 Sensors (Moisture/DHT)
                </div>
                <span className="text-farm-500 hidden md:block">→</span>
                <div className="px-4 py-2 bg-farm-900/30 text-farm-300 border border-farm-800/40 rounded-xl">
                  🔌 ESP32 Hub
                </div>
                <span className="text-farm-500 hidden md:block">→</span>
                <div className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 border border-slate-700/40">
                  💻 Bridge / Web Serial
                </div>
                <span className="text-farm-500 hidden md:block">→</span>
                <div className="px-4 py-2 bg-farm-600 text-white rounded-xl shadow-glow-green">
                  📊 AgriHub Dashboard
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Physical Field Sensor Installation Guide */}
          {activeTab === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center space-x-3 text-farm-400">
                <Wrench className="w-6 h-6" />
                <h2 className="text-xl font-bold text-white">{t('setup.tab3.title')}</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-3 text-xs leading-relaxed text-slate-300">
                <div className="flex items-start space-x-3 p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl">
                  <Droplets className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <span>{t('setup.tab3.moisture')}</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl">
                  <Thermometer className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  <span>{t('setup.tab3.dht22')}</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl">
                  <CloudRain className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
                  <span>{t('setup.tab3.rain')}</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl">
                  <Volume2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  <span>{t('setup.tab3.mic')}</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <span>{t('setup.tab3.vibe')}</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA controls inside main container */}
          <div className="mt-8 flex justify-between items-center border-t border-slate-800/60 pt-6">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Step {activeTab} of 3</span>
            <div className="flex space-x-3">
              {activeTab > 1 && (
                <button
                  onClick={() => setActiveTab(activeTab - 1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-white transition-all duration-300"
                >
                  {t('btn.back')}
                </button>
              )}
              {activeTab < 3 ? (
                <button
                  onClick={() => setActiveTab(activeTab + 1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all duration-300 flex items-center"
                >
                  <span>{t('btn.next')}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 rounded-xl bg-farm-600 hover:bg-farm-500 text-xs font-bold text-white shadow-glow-green transition-all duration-300 flex items-center border border-farm-500/20"
                >
                  <span>{t('setup.cta')}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating chatbot launcher */}
      <AIFieldChat />
    </div>
  );
};
