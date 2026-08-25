import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { PotholeReport, PriorityLevel } from '../types';
import { Sparkles, MapPin, ChevronRight } from 'lucide-react';

interface PotholeMapProps {
  reports: PotholeReport[];
  onSelectReport?: (report: PotholeReport) => void;
  center?: [number, number];
  zoom?: number;
}

// Custom Leaflet marker icons by priority
const createCustomIcon = (priority: PriorityLevel) => {
  let color = '#10b981'; // LOW = emerald
  let ring = '#059669';

  if (priority === 'CRITICAL') {
    color = '#ef4444'; // CRITICAL = red
    ring = '#b91c1c';
  } else if (priority === 'HIGH') {
    color = '#f97316'; // HIGH = orange
    ring = '#c2410c';
  } else if (priority === 'MEDIUM') {
    color = '#f59e0b'; // MEDIUM = amber
    ring = '#b45309';
  }

  const svgHtml = `
    <div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid #0f172a;
      box-shadow: 0 0 12px ${color}80;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0f172a;
      font-weight: bold;
    ">
      <div style="width: 10px; height: 10px; background-color: #0f172a; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const PotholeMap: React.FC<PotholeMapProps> = ({
  reports,
  onSelectReport,
  center = [37.774929, -122.419416],
  zoom = 13,
}) => {
  return (
    <div className="w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-slate-800 relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ minHeight: '450px', background: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createCustomIcon(report.priority)}
          >
            <Popup className="leaflet-popup-dark">
              <div className="p-1 space-y-2 w-56 text-slate-100 font-sans">
                <img
                  src={report.imageUrl}
                  alt={report.title}
                  className="w-full h-24 object-cover rounded-lg bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80';
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {report.priority} ({report.priorityScore}/100)
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{report.status}</span>
                </div>
                <h4 className="font-bold text-xs text-white leading-tight line-clamp-1">
                  {report.title}
                </h4>
                <div className="flex items-center text-[10px] text-slate-400 space-x-1">
                  <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">{report.address}</span>
                </div>

                {onSelectReport && (
                  <button
                    onClick={() => onSelectReport(report)}
                    className="w-full mt-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs flex items-center justify-center space-x-1"
                  >
                    <span>View Full Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
