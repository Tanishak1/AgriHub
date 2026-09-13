import React, { useEffect, useState } from 'react';
import { RefreshCw, Cpu } from 'lucide-react';
import { deviceAPI } from '../services/api';

export const HardwareDiagnosticsPage: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      setError('');
      const response = await deviceAPI.getDiagnostics('AGR-001');
      setDiagnostics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Diagnostics unavailable.');
    }
  };
  useEffect(() => { load(); }, []);

  return <div className="flex-1 p-6 space-y-6 overflow-y-auto">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-extrabold text-white">Hardware Diagnostics</h1><p className="text-xs text-slate-400 uppercase tracking-wider">ESP32 serial pipeline</p></div>
      <button onClick={load} className="p-3 rounded-xl bg-slate-800 text-slate-300" title="Refresh diagnostics"><RefreshCw className="w-4 h-4" /></button>
    </div>
    {error && <div className="text-sm text-red-400">{error}</div>}
    {diagnostics && <div className="glass-panel border border-slate-800 rounded-3xl p-6 space-y-4 text-sm text-slate-300">
      <div className="flex items-center gap-3"><Cpu className="text-farm-400" /><span>ESP32 {diagnostics.deviceId}: <strong className="text-white">{diagnostics.connectionState}</strong></span></div>
      <div>Serial Port: <strong className="text-white">{diagnostics.serialPort}</strong></div>
      <div>Baud Rate: <strong className="text-white">{diagnostics.baudRate}</strong></div>
      <div>Last Packet: <strong className="text-white">{diagnostics.lastPacketTime || 'None received'}</strong></div>
      <div>Raw Packet: <pre className="mt-2 p-3 bg-slate-950 rounded-xl text-xs">{diagnostics.rawPacket || 'No packet available'}</pre></div>
      <div>Validated Sensor Data: <pre className="mt-2 p-3 bg-slate-950 rounded-xl text-xs overflow-auto">{JSON.stringify(diagnostics.validatedSensorData, null, 2)}</pre></div>
    </div>}
  </div>;
};