import React, { useState, useEffect } from 'react';
import { PotholeReport } from '../types';
import { getReportsApi } from '../services/api';
import { PotholeMap } from '../components/PotholeMap';
import { MapPin, Filter, Sparkles } from 'lucide-react';

interface MapViewPageProps {
  onSelectReport: (report: PotholeReport) => void;
}

export const MapViewPage: React.FC<MapViewPageProps> = ({ onSelectReport }) => {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getReportsApi();
      setReports(data.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchPriority = priorityFilter === 'ALL' || r.priority === priorityFilter;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchPriority && matchStatus;
  });

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      {/* Map Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-bold text-white">Geospatial Hazard Map View</h2>
          <span className="text-xs text-slate-400 hidden md:inline">
            ({filteredReports.length} reports mapped)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Priority:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  priorityFilter === p
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Status:</span>
            {['ALL', 'SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REPAIRED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-2xl relative">
        {loading ? (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-slate-500">
            Loading interactive map...
          </div>
        ) : (
          <PotholeMap reports={filteredReports} onSelectReport={onSelectReport} />
        )}
      </div>
    </div>
  );
};
