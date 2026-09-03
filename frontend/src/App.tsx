import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import MapView from './components/MapView';
import SensorChart from './components/SensorChart';
import { Activity } from 'lucide-react';

const socket = io('http://localhost:5001');

function App() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const selectedSensor = sensors.find((s) => s.sensorId === selectedSensorId) ?? null;

  useEffect(() => {
    // Fetch initial sensors
    fetch('http://localhost:5001/api/sensors')
      .then((res) => res.json())
      .then((data) => setSensors(data))
      .catch((err) => console.log('Backend not started or unreachable', err));

    socket.on('sensor-update', (update) => {
      setSensors((prev) => {
        const existing = prev.find((s) => s.sensorId === update.sensorId);
        if (existing) {
          return prev.map((s) => s.sensorId === update.sensorId ? { ...s, lastValue: update.value, timestamp: update.timestamp } : s);
        }
        return [...prev, update];
      });
    });

    socket.on('alert', (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 10)); // keep last 10
    });

    return () => {
      socket.off('sensor-update');
      socket.off('alert');
    };
  }, []);

  return (
    <div className="flex h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 max-w-sm border-r border-neutral-800 p-6 overflow-y-auto bg-neutral-950 flex flex-col z-10 shadow-2xl relative">
        <h1 className="text-3xl font-extrabold mb-8 flex items-center gap-3 text-emerald-400 tracking-tight">
          <Activity size={32} /> CityTwin
        </h1>

        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4 font-bold">Live Alerts</h2>
          <div className="space-y-3">
            {alerts.length === 0 && (
              <div className="p-4 rounded-xl border border-neutral-800/50 bg-neutral-900/30 text-neutral-500 text-sm italic">
                No active anomalies detected.
              </div>
            )}
            {alerts.map((a, i) => (
              <div key={i} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm shadow-inner shadow-rose-500/5 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                <span className="font-bold flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  {a.sensorId}
                </span>
                <span className="text-rose-300 opacity-90">{a.message} (Peak: {a.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4 font-bold flex justify-between items-center">
            <span>Sensors Network</span>
            <span className="bg-emerald-500/20 text-emerald-400 py-1 px-2 rounded-full text-[10px]">{sensors.length} nodes</span>
          </h2>
          <div className="space-y-3">
            {sensors.map((s) => (
              <div
                key={s.sensorId || s.id}
                onClick={() => setSelectedSensorId(s.sensorId === selectedSensorId ? null : s.sensorId)}
                className={`p-4 bg-neutral-900 border rounded-xl flex justify-between items-center text-sm transition-colors cursor-pointer group ${
                  s.sensorId === selectedSensorId
                    ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                    : 'border-neutral-800/60 hover:border-emerald-500/30'
                }`}
              >
                <div>
                  <div className="font-bold text-neutral-200 group-hover:text-emerald-300 transition-colors">{s.name || s.sensorId}</div>
                  <div className="text-xs text-neutral-500 capitalize mt-1 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.type === 'pollution' ? 'bg-amber-400' : s.type === 'traffic' ? 'bg-blue-400' : 'bg-purple-400'}`}></span>
                    {s.type}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-mono text-base">{s.lastValue ?? '--'}</div>
                  <div className="text-[10px] text-neutral-600 uppercase tracking-wide">{s.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Map */}
      <div className="flex-1 relative bg-neutral-800 shadow-inner">
        <MapView sensors={sensors} />
        {selectedSensor && (
          <SensorChart sensor={selectedSensor} onClose={() => setSelectedSensorId(null)} />
        )}
      </div>
    </div>
  );
}

export default App;
