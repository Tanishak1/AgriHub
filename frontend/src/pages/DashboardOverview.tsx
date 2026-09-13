import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Droplets, Thermometer, CloudRain, Volume2, ShieldAlert, Sparkles, 
  CheckCircle2, Play, Square, RefreshCw, Cpu
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sensorAPI, aiAPI, deviceAPI } from '../services/api';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';

export const DashboardOverview: React.FC = () => {
  const { language, t } = useLanguage();
  const [sensors, setSensors] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('DISCONNECTED');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const navigate = useNavigate();
  const aiTimerRef = useRef<any>(null);

  const deviceId = 'ESP32_AGRIHUB';

  // Load static data from APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sensorRes, aiRes, deviceRes] = await Promise.all([
        sensorAPI.getSensors(),
        aiAPI.getRecommendation(),
        deviceAPI.getDevices()
      ]);
      setSensors(sensorRes.data);
      setRecommendation(aiRes.data);
      const device = deviceRes.data.find((item: any) => item.id === deviceId);
      setDeviceStatus(device?.status || 'DISCONNECTED');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up Real-Time WebSockets
    connectSocket(deviceId);
    const socket = getSocket();

    // Listen only for telemetry accepted from the physical hardware bridge.
    socket.on('telemetry', (data: any) => {
      setDeviceStatus('CONNECTED');
      setLastUpdate(data.timestamp);
      // Update sensor list in-memory dynamically
      setSensors((prevSensors) =>
        prevSensors.map((s) =>
          s.id === data.sensorId
            ? { ...s, currentReading: data.value, status: data.status }
            : s
        )
      );

      // Debounce recommendation refresh
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      aiTimerRef.current = setTimeout(async () => {
        try {
          const aiRes = await aiAPI.getRecommendation();
          setRecommendation(aiRes.data);
        } catch (err) {
          console.error(err);
        }
      }, 1000);
    });

    // Listen for connection state changes of the ESP32
    socket.on('device_status', (data: any) => {
      if (data.deviceId === deviceId) {
        setDeviceStatus(data.status);
      }
    });

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      socket.off('telemetry');
      socket.off('device_status');
      disconnectSocket(deviceId);
    };
  }, []);

  // Web Speech API Alert Readout
  const handleVoiceAdvisory = () => {
    if (!recommendation) return;

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    const script = language === 'EN' ? recommendation.speechScript : recommendation.speechScriptHi;
    const utterance = new SpeechSynthesisUtterance(script);
    
    utterance.lang = language === 'HI' ? 'hi-IN' : 'en-US';
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);
    
    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  // Helper to resolve sensor icons
  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'SOIL_MOISTURE': return <Droplets className="w-6 h-6 text-blue-400" />;
      case 'TEMPERATURE': return <Thermometer className="w-6 h-6 text-red-400" />;
      case 'HUMIDITY': return <Droplets className="w-6 h-6 text-teal-400" />;
      case 'RAINFALL': return <CloudRain className="w-6 h-6 text-sky-400" />;
      case 'SOUND': return <Volume2 className="w-6 h-6 text-green-400" />;
      case 'VIBRATION': return <ShieldAlert className="w-6 h-6 text-amber-500" />;
      default: return <Cpu className="w-6 h-6 text-slate-400" />;
    }
  };

  // Helper to resolve status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'border-farm-500/40 text-farm-400 bg-farm-950/20';
      case 'WARNING': return 'border-amber-500/40 text-amber-400 bg-amber-950/20';
      case 'CRITICAL': return 'border-red-500/40 text-red-400 bg-red-950/20 animate-pulse';
      case 'FAILURE': return 'border-slate-700 text-slate-500 bg-slate-900/30';
      default: return 'border-slate-800 text-slate-400 bg-slate-900/10';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'bg-farm-500 shadow-glow-green';
      case 'WARNING': return 'bg-amber-500';
      case 'CRITICAL': return 'bg-red-500 shadow-glow-red animate-ping';
      case 'FAILURE': return 'bg-slate-600';
      default: return 'bg-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 min-h-screen text-slate-400 font-bold uppercase tracking-widest text-xs space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-farm-500" />
        <span>{t('welcome.loading')}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Dashboard Title & Hardware Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">{t('dash.title')}</h1>
          <p className="text-xs text-slate-400 font-medium">Monitoring device ESP32_AGRIHUB in West Wheat Field</p>
        </div>

        <div className={`flex flex-col items-end text-[10px] font-bold uppercase tracking-wider ${deviceStatus === 'CONNECTED' ? 'text-farm-300' : 'text-amber-400'}`}>
          <span>{deviceStatus === 'CONNECTED' ? 'Hardware connected' : deviceStatus === 'ERROR' ? 'Hardware error' : 'Hardware disconnected'}</span>
          <span className="text-slate-500 normal-case tracking-normal">{lastUpdate ? `Last update ${new Date(lastUpdate).toLocaleTimeString()}` : 'Waiting for sensor data'}</span>
        </div>
      </div>

      {/* Main Grid: Crop Advisory Card (Performance Ration) + Sensor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Ration Card (Takes 1 Col on Large, fits top on Mobile) */}
        {recommendation && (
          <div className="glass-panel border border-slate-800/80 rounded-3xl p-6 lg:col-span-1 flex flex-col justify-between space-y-6">
            
            {/* Score Title */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-farm-400" />
                  {t('dash.healthTitle')}
                </h3>
                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${
                  recommendation.priority === 'HIGH' ? 'bg-red-950/20 text-red-400 border border-red-900/40' : 'bg-farm-900/20 text-farm-300 border border-farm-800/40'
                }`}>
                  {recommendation.priority} PRIORITY
                </span>
              </div>

              {/* Crop Health Circle Visualizer */}
              <div className="flex items-center space-x-5 py-2">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center relative shadow-glow-green">
                  <div className="absolute inset-0.5 rounded-full border-4 border-farm-500 border-r-transparent"></div>
                  <span className="text-xl font-extrabold text-white">{recommendation.healthScore}%</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t('dash.score')}</h4>
                  <p className="text-xs font-bold text-white mt-0.5">Crop Status: {recommendation.healthScore > 80 ? 'Excellent' : 'Needs attention'}</p>
                </div>
              </div>
            </div>

            {/* AI Recommendation Message */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 space-y-2">
              <h5 className="text-[10px] font-bold text-farm-400 uppercase tracking-widest">{t('dash.advisory')}</h5>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                {language === 'EN' ? recommendation.actionRequired : recommendation.actionRequiredHi}
              </p>
            </div>

            {/* Weather advisory */}
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('dash.weather')}</h5>
              <p className="text-xs text-slate-300">
                {language === 'EN' ? recommendation.weatherSummary : recommendation.weatherSummaryHi}
              </p>
            </div>

            {/* Local Language Audio Voice Alerts Trigger */}
            <button
              onClick={handleVoiceAdvisory}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 border ${
                isPlayingVoice 
                  ? 'bg-red-950/20 text-red-400 border-red-900/40' 
                  : 'bg-farm-600 hover:bg-farm-500 text-white border-farm-500/20 shadow-glow-green'
              }`}
            >
              {isPlayingVoice ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlayingVoice ? 'Stop Audio Broadcast' : 'Listen Voice Advisory'}</span>
            </button>
          </div>
        )}

        {/* 6 Sensors Grid (Takes 2 Cols on Large) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 px-1">
            {t('dash.telemetryTitle')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sensors.map((sensor) => {
              const borderClass = getStatusColor(sensor.status);
              const dotClass = getStatusDot(sensor.status);
              const labelKey = `sensor.${sensor.type}`;

              return (
                <div
                  key={sensor.id}
                  onClick={() => navigate(`/sensor/${sensor.id}`)}
                  className={`glass-panel border p-5 rounded-3xl flex flex-col justify-between h-44 hover:shadow-glow-green hover:border-farm-500/40 transition-all duration-300 cursor-pointer ${borderClass}`}
                >
                  {/* Top: Icon & status light */}
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/40">
                      {getSensorIcon(sensor.type)}
                    </div>
                    
                    {/* Status Dot */}
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
                      <span className="text-[9px] font-bold tracking-widest uppercase">{sensor.status}</span>
                    </div>
                  </div>

                  {/* Middle: Current reading value */}
                  <div className="my-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight">{deviceStatus === 'CONNECTED' ? sensor.currentReading : '--'}</span>
                    {deviceStatus === 'CONNECTED' && <span className="text-sm font-semibold text-slate-400 ml-1">{sensor.unit}</span>}
                  </div>

                  {/* Bottom: Label and threshold boundaries */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 tracking-wide line-clamp-1">{t(labelKey)}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Limit: {sensor.minThreshold}{sensor.unit} - {sensor.maxThreshold}{sensor.unit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Activity / Telemetry Logs */}
      {recommendation && recommendation.insights && (
        <div className="glass-panel border border-slate-800/80 rounded-3xl p-6">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 mb-4 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-farm-400" />
            Agronomic Field Insights
          </h3>
          <ul className="space-y-3">
            {(language === 'EN' ? recommendation.insights : recommendation.insightsHi).map((insight: string, idx: number) => (
              <li key={idx} className="flex items-start text-xs text-slate-300 space-x-3 p-3 bg-slate-900/20 rounded-2xl border border-slate-850">
                <span className="w-1.5 h-1.5 rounded-full bg-farm-400 mt-1.5 shrink-0 shadow-glow-green"></span>
                <span className="leading-relaxed font-normal">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
