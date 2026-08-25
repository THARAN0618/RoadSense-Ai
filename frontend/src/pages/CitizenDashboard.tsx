import React, { useState, useEffect } from 'react';
import { PotholeReport } from '../types';
import { getReportsApi } from '../services/api';
import { PotholeCard } from '../components/PotholeCard';
import { AlertCircle, PlusCircle, CheckCircle, Clock, Search, Filter } from 'lucide-react';

interface CitizenDashboardProps {
  onSelectReport: (report: PotholeReport) => void;
  onOpenReportModal: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onSelectReport,
  onOpenReportModal,
}) => {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getReportsApi();
      setReports(data.reports);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCount = reports.length;
  const inProgressCount = reports.filter((r) => ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length;
  const repairedCount = reports.filter((r) => ['REPAIRED', 'CLOSED'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <h2 className="text-xl font-bold text-white">My Pothole & Road Reports</h2>
          <p className="text-xs text-slate-400">Track AI severity priority score and real-time repair progress</p>
        </div>
        <button
          onClick={onOpenReportModal}
          className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-sky-500/20 z-10 transition-transform transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Pothole</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
            {totalCount}
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Submissions</div>
            <div className="text-lg font-bold text-white">{totalCount} Reports</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            {inProgressCount}
          </div>
          <div>
            <div className="text-xs text-slate-400">Active / In Repair</div>
            <div className="text-lg font-bold text-amber-400">{inProgressCount} Active</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            {repairedCount}
          </div>
          <div>
            <div className="text-xs text-slate-400">Repaired & Resolved</div>
            <div className="text-lg font-bold text-emerald-400">{repairedCount} Closed</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or street..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'SUBMITTED', 'VERIFIED', 'IN_PROGRESS', 'REPAIRED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
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

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading pothole reports...</div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Pothole Reports Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't submitted any pothole reports matching this filter. Click below to submit a new report.
          </p>
          <button
            onClick={onOpenReportModal}
            className="mt-2 inline-flex items-center space-x-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Pothole Report</span>
          </button>
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
