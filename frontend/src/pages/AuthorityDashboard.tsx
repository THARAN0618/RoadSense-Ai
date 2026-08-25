import React, { useState, useEffect } from 'react';
import { PotholeReport } from '../types';
import { getReportsApi } from '../services/api';
import { PotholeCard } from '../components/PotholeCard';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, Search, Sparkles } from 'lucide-react';

interface AuthorityDashboardProps {
  onSelectReport: (report: PotholeReport) => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({ onSelectReport }) => {
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

  const pendingVerification = reports.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW');
  const criticalCount = reports.filter((r) => r.priority === 'CRITICAL' && r.status !== 'REPAIRED').length;
  const activeDispatchCount = reports.filter((r) => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length;

  const filteredReports = reports.filter((r) => {
    const matchPriority = priorityFilter === 'ALL' || r.priority === priorityFilter;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchPriority && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-950 border border-amber-500/20 rounded-3xl p-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Municipal Authority Dispatch Center</h2>
          </div>
          <p className="text-xs text-slate-400">
            Review AI prioritized pothole reports, verify hazards, override scores, and dispatch repair crews.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            {pendingVerification.length}
          </div>
          <div>
            <div className="text-xs text-slate-400">Pending Verification</div>
            <div className="text-lg font-bold text-amber-400">{pendingVerification.length} Hazards</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
            {criticalCount}
          </div>
          <div>
            <div className="text-xs text-slate-400">Critical Priority Alerts</div>
            <div className="text-lg font-bold text-red-400">{criticalCount} Critical</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            {activeDispatchCount}
          </div>
          <div>
            <div className="text-xs text-slate-400">Field Worker Dispatches</div>
            <div className="text-lg font-bold text-indigo-400">{activeDispatchCount} Dispatched</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Priority Filter:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                priorityFilter === p
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Status:</span>
          {['ALL', 'SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REPAIRED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading authority reports...</div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500">
          No reports matching current filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <PotholeCard key={report.id} report={report} onSelect={onSelectReport} />
          ))}
        </div>
      )}
    </div>
  );
};
