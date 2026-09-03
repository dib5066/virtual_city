import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import { X, TrendingUp } from 'lucide-react';

const TYPE_COLOR: Record<string, string> = {
  pollution: '#fbbf24',
  traffic:   '#60a5fa',
  weather:   '#c084fc',
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

interface Props {
  sensor: any;
  onClose: () => void;
}

export default function SensorChart({ sensor, onClose }: Props) {
  const [data, setData] = useState<{ time: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData([]);
    fetch(`http://localhost:5001/api/telemetry/${sensor.sensorId}`)
      .then((r) => r.json())
      .then((raw: any[]) => {
        const chart = [...raw]
          .reverse()
          .map((d) => ({ time: formatTime(d.timestamp), value: d.value }));
        setData(chart);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sensor.sensorId]);

  const color = TYPE_COLOR[sensor.type] || '#34d399';
  const values = data.map((d) => d.value);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  const max = values.length ? Math.max(...values) : null;
  const min = values.length ? Math.min(...values) : null;

  return (
    <div
      className="absolute bottom-10 right-4 h-1/3 w-[580px] z-20 flex bg-[#202020] flex-col shadow-2xl border-t border-l border-neutral-800 rounded-xl"
      style={{
        // background: 'rgba(9,9,9,0.97)',
        backdropFilter: 'blur(12px)',
        animation: 'slideInUp 0.25s ease',
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
          <h2 className="font-bold text-white text-sm tracking-tight">
            {sensor.name || sensor.sensorId}
          </h2>
          <span className="text-neutral-300 text-xs capitalize">{sensor.type}</span>
          <span className="text-neutral-400 text-xs">· last 100 readings</span>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
        >
          <X size={16} />
        </button>
      </div>

      {/* Chart — takes most of the space */}
      <div className="flex-1 min-h-0 px-3 pt-3 pb-1">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-300">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: `${color}40`, borderTopColor: color }}
            />
            <span className="text-xs">Fetching telemetry…</span>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-300 text-sm italic">
            No historical data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#1c1c1c" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#404040', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#404040', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={38}
              />
              {avg !== null && (
                <ReferenceLine
                  y={avg}
                  stroke="#525252"
                  strokeDasharray="4 4"
                  label={{ value: 'avg', fill: '#525252', fontSize: 9, position: 'insideTopRight' }}
                />
              )}
              <Tooltip
                contentStyle={{
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#737373', fontSize: 10 }}
                itemStyle={{ color }}
                formatter={(v: any) => [`${v} ${sensor.unit}`, 'Value']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats row — below the graph */}
      <div className="shrink-0 border-t border-neutral-800 grid grid-cols-5 divide-x divide-neutral-800 rounded-b-xl">
        <div className="px-4 py-2.5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-0.5">Live</p>
          <p className="text-lg font-mono font-bold" style={{ color }}>{sensor.lastValue ?? '--'}</p>
          <p className="text-[10px] text-neutral-600">{sensor.unit || ''}</p>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-0.5">Avg</p>
          <p className="text-lg font-mono font-bold text-neutral-300">{avg ?? '--'}</p>
          <p className="text-[10px] text-neutral-600">{sensor.unit || ''}</p>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-0.5">Peak</p>
          <p className="text-lg font-mono font-bold text-rose-400">{max ?? '--'}</p>
          <p className="text-[10px] text-neutral-600">{sensor.unit || ''}</p>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-0.5">Min</p>
          <p className="text-lg font-mono font-bold text-emerald-400">{min ?? '--'}</p>
          <p className="text-[10px] text-neutral-600">{sensor.unit || ''}</p>
        </div>
        <div className="px-4 py-2.5 flex flex-col justify-center">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-0.5">Samples</p>
          <p className="text-lg font-mono font-bold text-neutral-400">{data.length}</p>
          <p className="text-[10px] text-neutral-600 flex items-center gap-1">
            <TrendingUp size={10} className="text-emerald-600" /> readings
          </p>
        </div>
      </div>
    </div>
  );
}
