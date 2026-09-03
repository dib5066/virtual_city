import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix typical leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for different types
const createIcon = (color: string) => {
  const ring = (delay: string) =>
    `<span style="position:absolute;top:50%;left:50%;width:14px;height:14px;border-radius:50%;border:2px solid ${color};animation:sensorRipple 2.2s ease-out infinite ${delay};"></span>`;

  return new L.DivIcon({
    className: '',
    html: `
      <div style="position:relative;width:14px;height:14px;">
        ${ring('0s')}
        ${ring('0.9s')}
        ${ring('1.8s')}
        <div style="position:absolute;top:0;left:0;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 10px ${color};"></div>
      </div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const icons = {
  pollution: createIcon('#fbbf24'), // amber-400
  traffic: createIcon('#60a5fa'),   // blue-400
  weather: createIcon('#c084fc'),   // purple-400
  default: createIcon('#34d399')    // emerald-400
};

export default function MapView({ sensors }: { sensors: any[] }) {
  // Map center updated to your new MMMUT coordinates
  const position: [number, number] = [26.73523, 83.42323];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0" zoomControl={false}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark View">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">Carto</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Light View">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">Carto</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        {sensors.map((s) => {
          if (!s.location || !s.location.lat) return null;

          const icon = icons[s.type as keyof typeof icons] || icons.default;

          return (
            <Marker key={s.sensorId || s._id} position={[s.location.lat, s.location.lng]} icon={icon}>
              <Popup className="custom-popup">
                <div className="p-2 min-w-[120px]">
                  <h3 className="font-bold text-sm text-neutral-800 tracking-tight">{s.name}</h3>
                  <p className="capitalize text-neutral-500 text-xs mt-0.5">{s.type}</p>
                  <p className="mt-2 text-xl font-mono text-emerald-600 font-bold">
                    {s.lastValue || '--'} <span className="text-xs text-neutral-500 font-sans tracking-tight">{s.unit}</span>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
