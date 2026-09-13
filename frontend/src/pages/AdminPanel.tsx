import React, { useState, useEffect } from 'react';
import { Shield, Users, Cpu, FileText, Settings, Database, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { alertAPI, deviceAPI } from '../services/api';

export const AdminPanel: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    usersCount: 2,
    devicesCount: 1,
    activeSensors: 6,
    alertsCount: 2,
  });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([deviceAPI.getDevices(), alertAPI.getAlerts()]).then(([response, alertsResponse]) => {
      const devices = response.data;
      const sensors = devices.flatMap((device: any) => device.sensors || []);
      setStats({ usersCount: 0, devicesCount: devices.length, activeSensors: sensors.filter((sensor: any) => sensor.status !== 'FAILURE').length, alertsCount: alertsResponse.data.length });
      setLogs(devices.map((device: any) => `[HARDWARE] ${device.id}: ${device.status}; last seen ${new Date(device.lastSeen).toLocaleString()}`));
    }).catch((error) => setLogs([`[BACKEND] Unable to load hardware status: ${error.message}`]));
  }, []);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">{t('nav.admin')}</h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">System audit metrics and database telemetry controllers</p>
      </div>

      {/* Audit Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Users */}
        <div className="glass-panel border border-slate-800/80 p-5 rounded-3xl flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-farm-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Farmers</h4>
            <span className="text-2xl font-extrabold text-white">{stats.usersCount}</span>
          </div>
        </div>

        {/* Devices */}
        <div className="glass-panel border border-slate-800/80 p-5 rounded-3xl flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-teal-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Registered Hubs</h4>
            <span className="text-2xl font-extrabold text-white">{stats.devicesCount}</span>
          </div>
        </div>

        {/* Active Sensors */}
        <div className="glass-panel border border-slate-800/80 p-5 rounded-3xl flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-amber-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Probes</h4>
            <span className="text-2xl font-extrabold text-white">{stats.activeSensors}</span>
          </div>
        </div>

        {/* Alerts */}
        <div className="glass-panel border border-slate-800/80 p-5 rounded-3xl flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-red-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Logged Alerts</h4>
            <span className="text-2xl font-extrabold text-white">{stats.alertsCount}</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Debug Console & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Terminal Logs (Takes 2 Columns) */}
        <div className="lg:col-span-2 glass-panel border border-slate-800/80 rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-800/60 pb-3 flex items-center">
            <Database className="w-4 h-4 mr-2 text-farm-400" />
            Live System Event Console
          </h3>

          <div className="rounded-2xl border border-slate-850 bg-slate-950 p-4 h-64 overflow-y-auto space-y-2 font-mono text-[10px] text-slate-400">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2 border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Configurations overrides */}
        <div className="glass-panel border border-slate-800/80 rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-800/60 pb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2 text-farm-400" />
            System Overrides
          </h3>

          <div className="space-y-3.5 text-xs font-bold">
            <button className="w-full py-3 bg-red-950/20 text-red-400 hover:bg-red-950/40 border border-red-900/40 rounded-xl transition-all uppercase tracking-wider text-[10px] font-extrabold">
              Flush Telemetry Tables
            </button>
            <button className="w-full py-3 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition-all uppercase tracking-wider text-[10px] font-extrabold">
              Recalibrate Alarm Offsets
            </button>
            <button className="w-full py-3 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition-all uppercase tracking-wider text-[10px] font-extrabold">
              Download Diagnostic Logs
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
