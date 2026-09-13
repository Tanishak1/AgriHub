import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, Info, Save, Sliders, LineChart, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sensorAPI } from '../services/api';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';

export const SensorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [sensor, setSensor] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [range, setRange] = useState<string>('1d'); // '1d', '7d', '30d'
  
  // Configuration Form State
  const [name, setName] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [maxThreshold, setMaxThreshold] = useState('');

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const deviceId = 'AGR-001';

  const fetchSensorDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [sensorRes, readingsRes] = await Promise.all([
        sensorAPI.getSensorDetail(id),
        sensorAPI.getSensorReadings(id, range)
      ]);
      setSensor(sensorRes.data);
      setReadings(readingsRes.data);
      
      setName(sensorRes.data.name);
      setMinThreshold(sensorRes.data.minThreshold !== null ? sensorRes.data.minThreshold.toString() : '');
      setMaxThreshold(sensorRes.data.maxThreshold !== null ? sensorRes.data.maxThreshold.toString() : '');
    } catch (err) {
      console.error('Error fetching sensor detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorDetails();

    connectSocket(deviceId);
    const socket = getSocket();

    socket.on('telemetry', (data: any) => {
      if (id && data.sensorId === id) {
        setSensor((prev: any) => prev ? { ...prev, currentReading: data.value, status: data.status } : prev);
      }
    });

    return () => {
      socket.off('telemetry');
      disconnectSocket(deviceId);
    };
  }, [id, range]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || updating) return;
    try {
      setUpdating(true);
      const res = await sensorAPI.updateThresholds(id, {
        name,
        minThreshold: minThreshold === '' ? null : parseFloat(minThreshold),
        maxThreshold: maxThreshold === '' ? null : parseFloat(maxThreshold),
      });
      setSensor(res.data.sensor);
      setSuccessMsg('Sensor configurations updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating thresholds:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Format timestamp for chart X-axis
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (range === '1d') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Render safe range warnings
  const renderRangeAdvisory = () => {
    if (!sensor) return null;
    const current = sensor.currentReading;
    const min = sensor.minThreshold;
    const max = sensor.maxThreshold;

    if (min !== null && current < min && current > 0) {
      return (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-amber-300 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            {language === 'EN' 
              ? `Warning: Current reading is below safe threshold limit of ${min}${sensor.unit}. Consider adjusting crop parameters.`
              : `चेतावनी: वर्तमान रीडिंग सुरक्षित सीमा ${min}${sensor.unit} से नीचे है। सिंचाई या मिट्टी उपचार पर विचार करें।`}
          </span>
        </div>
      );
    }

    if (max !== null && current > max) {
      return (
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 text-red-300 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            {language === 'EN' 
              ? `Warning: Current reading is exceeding safe limit of ${max}${sensor.unit}. Anomaly logs have been generated.`
              : `चेतावनी: वर्तमान रीडिंग सुरक्षित सीमा ${max}${sensor.unit} से अधिक है। विसंगति लॉग उत्पन्न किए गए हैं।`}
          </span>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-2xl bg-farm-950/20 border border-farm-900/40 text-farm-300 text-xs flex items-start space-x-3">
        <Info className="w-5 h-5 shrink-0" />
        <span>
          {language === 'EN' 
            ? `Status Normal: Telemetry lies within safe boundaries.`
            : `स्थिति सामान्य है: टेलीमेट्री सुरक्षित सीमाओं के भीतर स्थित है।`}
        </span>
      </div>
    );
  };

  if (loading && !sensor) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 text-slate-500 text-xs font-bold uppercase tracking-widest">
        Loading sensor history...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">{sensor?.name}</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Device: {sensor?.deviceId} • Type: {sensor?.type}</p>
        </div>
      </div>

      {/* Main Grid: Graph + Threshold Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Graph Area (Takes 2 Columns) */}
        <div className="lg:col-span-2 glass-panel border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between h-[450px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 mb-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center">
              <LineChart className="w-4 h-4 mr-2 text-farm-400" />
              {t('sensor.history')}
            </h3>
            
            {/* Filter Tabs (1d, 7d, 30d) */}
            <div className="flex border border-slate-800 bg-slate-900/60 p-1 rounded-xl text-[11px] font-bold uppercase tracking-wider">
              {['1d', '7d', '30d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    range === r ? 'bg-farm-600 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Graph Visualizer */}
          <div className="flex-1 w-full mt-2">
            {readings.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                No historical records registered for this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="95%">
                <AreaChart data={readings}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatXAxis} 
                    stroke="rgba(255,255,255,0.2)"
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    tick={{ fontSize: 9 }}
                    unit={sensor?.unit}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#09150c', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Configurations Form Panel */}
        <div className="glass-panel border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center border-b border-slate-800/60 pb-3">
              <Sliders className="w-4 h-4 mr-2 text-farm-400" />
              {t('sensor.editThresholds')}
            </h3>

            {successMsg && (
              <div className="p-3 rounded-xl bg-farm-950/20 border border-farm-800/30 text-farm-300 text-xs font-semibold animate-fadeIn">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-semibold">
              
              {/* Sensor Display Name */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-widest">Sensor Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                  required
                />
              </div>

              {/* Threshold Safe Bounds */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-widest">{t('sensor.min')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={minThreshold}
                      onChange={(e) => setMinThreshold(e.target.value)}
                      placeholder="None"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-500">{sensor?.unit}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-widest">{t('sensor.max')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={maxThreshold}
                      onChange={(e) => setMaxThreshold(e.target.value)}
                      placeholder="None"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-500">{sensor?.unit}</span>
                  </div>
                </div>
              </div>

              {/* Action Submit */}
              <button
                type="submit"
                disabled={updating}
                className="w-full py-3.5 rounded-xl bg-farm-600 hover:bg-farm-500 disabled:bg-slate-800 text-white font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 border border-farm-500/20 shadow-glow-green"
              >
                <Save className="w-4 h-4" />
                <span>{updating ? 'Saving...' : t('btn.save')}</span>
              </button>
            </form>
          </div>

          {/* Current Advisory */}
          <div className="mt-6 border-t border-slate-800/40 pt-6 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Safe Guard</h4>
            {renderRangeAdvisory()}
          </div>
        </div>
      </div>
    </div>
  );
};
