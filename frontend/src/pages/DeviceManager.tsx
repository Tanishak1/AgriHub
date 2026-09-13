import React, { useState, useEffect } from 'react';
import {
  Cpu, Plus, Trash2, Terminal
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cropAPI, deviceAPI } from '../services/api';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';

export const DeviceManager: React.FC = () => {
  const { t } = useLanguage();
  const [devices, setDevices] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [loading, setLoading] = useState(true);

  // Registration Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('ESP32');
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');
  const [creatingFarm, setCreatingFarm] = useState(false);

  // Physical bridge status and diagnostic output
  const [serialLogs] = useState<string[]>([]);
  const [isReadingSerial, setIsReadingSerial] = useState(false);

  const deviceId = 'AGR-001';

  const fetchMyFarms = async () => {
    try {
      const farmRes = await cropAPI.getFarms();
      const farmList = farmRes.data || [];
      setFarms(farmList);
      setSelectedFarmId((prev) => prev || farmList[0]?.id || '');
    } catch (err) {
      console.error('Unable to load farmer farms:', err);
      setFarms([]);
      setSelectedFarmId('');
    }
  };

  const fetchDevicesAndSimulator = async () => {
    try {
      setLoading(true);
      const deviceRes = await deviceAPI.getDevices();
      setDevices(deviceRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchDevicesAndSimulator(), fetchMyFarms()]);
    };

    loadData();

    // Connect to WebSockets for real-time telemetry synchronization
    connectSocket(deviceId);
    const socket = getSocket();

    socket.on('telemetry', (data: any) => {
      // Synchronize device card sensors in real-time
      setDevices((prevDevices) =>
        prevDevices.map((dev) => ({
          ...dev,
          sensors: dev.sensors.map((s: any) =>
            s.id === data.sensorId
              ? { ...s, currentReading: data.value, status: data.status }
              : s
          ),
        }))
      );
    });

    socket.on('device_status', (data: any) => {
      setDevices((prevDevices) =>
        prevDevices.map((dev) =>
          dev.id === data.deviceId ? { ...dev, status: data.status } : dev
        )
      );
      setIsReadingSerial(data.status === 'CONNECTED');
    });

    return () => {
      socket.off('telemetry');
      socket.off('device_status');
      disconnectSocket(deviceId);
    };
  }, []);

  const handleCreateFarm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFarmName.trim()) return;

    try {
      setCreatingFarm(true);
      const createdFarm = await cropAPI.createFarm({
        name: newFarmName,
        location: newFarmLocation || 'Rural Zone',
      });
      await fetchMyFarms();
      setSelectedFarmId(createdFarm.data.id);
      setNewFarmName('');
      setNewFarmLocation('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Unable to create farm.');
    } finally {
      setCreatingFarm(false);
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName || !selectedFarmId) {
      alert('Please choose a farm for this device registration.');
      return;
    }

    try {
      await deviceAPI.addDevice({
        id: newId,
        name: newName,
        type: newType,
        farmId: selectedFarmId,
      });
      setNewId('');
      setNewName('');
      setShowAddForm(false);
      await fetchDevicesAndSimulator();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Registration failed.');
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to unregister this device?')) return;
    try {
      await deviceAPI.deleteDevice(id);
      fetchDevicesAndSimulator();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest">
        Loading devices...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">{t('dev.title')}</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Configure ESP32 nodes and simulators</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-farm-600 hover:bg-farm-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-glow-green border border-farm-500/20 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('dev.addBtn')}</span>
        </button>
      </div>

      {/* Register Form */}
      {showAddForm && (
        <div className="glass-panel border border-slate-800 p-6 rounded-3xl space-y-4 animate-fadeIn text-xs font-bold">
          {farms.length === 0 ? (
            <form onSubmit={handleCreateFarm} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-400 uppercase tracking-widest">Farm Name</label>
                <input
                  type="text"
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  placeholder="e.g. Green Valley Farm"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-widest">Location</label>
                <input
                  type="text"
                  value={newFarmLocation}
                  onChange={(e) => setNewFarmLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={creatingFarm}
                  className="px-4 py-2.5 rounded-xl bg-farm-600 hover:bg-farm-500 text-white shadow-glow-green border border-farm-500/20 uppercase tracking-widest font-extrabold"
                >
                  {creatingFarm ? 'Creating Farm...' : 'Create My Farm'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterDevice} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-400 uppercase tracking-widest">Farm</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                >
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-widest">{t('dev.id')}</label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="e.g. AGR-002"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-255 focus:outline-none focus:border-farm-500/50"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-widest">{t('dev.name')}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. South Boundary Sensor"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-255 focus:outline-none focus:border-farm-500/50"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-widest">{t('dev.type')}</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-255 focus:outline-none focus:border-farm-500/50"
                >
                  <option value="ESP32">Physical ESP32 (USB/Bridge)</option>
                </select>
              </div>
              <div className="flex items-end md:col-span-5">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-farm-600 hover:bg-farm-500 text-white shadow-glow-green border border-farm-500/20 uppercase tracking-widest font-extrabold"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Devices Listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Device Cards column */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 px-1">Active Hardware Devices</h2>
          {devices.map((dev) => (
            <div key={dev.id} className="glass-panel border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900/60 border border-slate-800/40 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-farm-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{dev.name}</h3>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">ID: {dev.id} • FW: {dev.firmwareVersion}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold tracking-wider border ${
                    dev.status === 'CONNECTED' 
                      ? 'bg-farm-950/20 text-farm-400 border-farm-800/40' 
                      : dev.status === 'ERROR' 
                      ? 'bg-red-950/20 text-red-400 border-red-900/40 animate-pulse' 
                      : 'bg-slate-900/40 text-slate-500 border-slate-800/60'
                  }`}>
                    {dev.status}
                  </span>
                  
                  <button
                    onClick={() => handleDeleteDevice(dev.id)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-855 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Connected sensors stats */}
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] uppercase font-bold text-slate-400">
                {dev.sensors.map((s: any) => (
                  <span key={s.id} className="px-2.5 py-1.5 rounded-xl bg-slate-900/40 border border-slate-850">
                    {s.type.replace('_', ' ')}: {s.currentReading}{s.unit}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Web Serial & Direct USB Bridge Column */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 px-1">{t('dev.serialHeader')}</h2>
          <div className="glass-panel border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Connect an ESP32 or Arduino microcontroller directly to your laptop's USB port. Our frontend will parse telemetry strings (JSON format) and update the farm dashboard in real time.
            </p>

            <div className={`text-xs font-bold uppercase tracking-wider ${isReadingSerial ? 'text-farm-400' : 'text-amber-400'}`}>
              {isReadingSerial ? 'Physical bridge connected' : 'Start the hardware bridge to connect'}
            </div>

            {/* Serial Console */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950 p-4 h-48 overflow-y-auto flex flex-col-reverse">
              {serialLogs.length === 0 ? (
                <span className="text-[10px] text-slate-600 font-mono italic">No console logs. Click Pair Device to open channel...</span>
              ) : (
                <div className="space-y-1 font-mono text-[9px] text-slate-400">
                  {serialLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <Terminal className="w-3.5 h-3.5 text-farm-500 shrink-0 mt-0.5" />
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
