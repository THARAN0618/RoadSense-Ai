import React, { useState, useEffect } from 'react';
import { PotholeReport } from '../types';
import { getAssignedJobsApi } from '../services/api';
import { PotholeCard } from '../components/PotholeCard';
import { Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface WorkerDashboardProps {
  onSelectReport: (report: PotholeReport) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ onSelectReport }) => {
  const [jobs, setJobs] = useState<PotholeReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getAssignedJobsApi();
      setJobs(data.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const assignedCount = jobs.filter((j) => j.status === 'ASSIGNED').length;
  const inProgressCount = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
  const completedCount = jobs.filter((j) => ['REPAIRED', 'CLOSED'].includes(j.status)).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-950 border border-emerald-500/20 rounded-3xl p-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Field Repair Operations Portal</h2>
          </div>
          <p className="text-xs text-slate-400">
            View assigned pothole jobs sorted by priority score, accept dispatches, start repairs, and submit evidence photos.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            {assignedCount}
          </div>
          <div>
            <div className="text-xs text-slate-400">Assigned Pending Start</div>
            <div className="text-lg font-bold text-indigo-400">{assignedCount} Jobs</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
            {inProgressCount}
          </div>
          <div>
            <div className="text-xs text-slate-400">In-Progress Repairs</div>
            <div className="text-lg font-bold text-sky-400">{inProgressCount} Active</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            {completedCount}
          </div>
          <div>
            <div className="text-xs text-slate-400">Completed Repairs</div>
            <div className="text-lg font-bold text-emerald-400">{completedCount} Repaired</div>
          </div>
        </div>
      </div>

      {/* Assigned Jobs List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading assigned repair jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500">
          No repair jobs currently assigned to your crew.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <PotholeCard key={job.id} report={job} onSelect={onSelectReport} />
          ))}
        </div>
      )}
    </div>
  );
};
