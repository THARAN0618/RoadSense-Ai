import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PotholeReport, User } from '../types';
import {
  verifyReportApi,
  rejectReportApi,
  assignWorkerApi,
  overridePriorityApi,
  addCommentApi,
  getAdminUsersApi,
  acceptJobApi,
  startRepairApi,
  completeRepairApi,
} from '../services/api';
import { StatusTimeline } from './StatusTimeline';
import { PotholeMap } from './PotholeMap';
import {
  X,
  Sparkles,
  MapPin,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  XCircle,
  Wrench,
  MessageSquare,
  Upload,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

interface ReportDetailModalProps {
  report: PotholeReport | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'actions' | 'comments'>('overview');
  
  // Authority / Admin state
  const [workers, setWorkers] = useState<User[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [overridePriorityVal, setOverridePriorityVal] = useState<string>('HIGH');
  const [overrideReason, setOverrideReason] = useState<string>('');
  
  // Worker repair state
  const [repairNotes, setRepairNotes] = useState<string>('');
  const [afterImageFile, setAfterImageFile] = useState<File | null>(null);
  
  // Comment state
  const [commentText, setCommentText] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (['AUTHORITY', 'ADMIN'].includes(user?.role || '')) {
      fetchWorkers();
    }
  }, [user]);

  const fetchWorkers = async () => {
    try {
      const data = await getAdminUsersApi({ role: 'FIELD_WORKER' });
      setWorkers(data.users);
      if (data.users.length > 0) {
        setSelectedWorkerId(data.users[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!report) return null;

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      await verifyReportApi(report.id);
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      setError('Please provide a rejection reason.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await rejectReportApi(report.id, rejectReason);
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Rejection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorker = async () => {
    if (!selectedWorkerId) return;
    try {
      setLoading(true);
      setError(null);
      await assignWorkerApi(report.id, selectedWorkerId);
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Worker assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOverridePriority = async () => {
    if (!overrideReason) {
      setError('Please provide a justification for priority override.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await overridePriorityApi(report.id, overridePriorityVal, overrideReason);
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Priority override failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async () => {
    try {
      setLoading(true);
      await acceptJobApi(report.id);
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to accept job');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRepair = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('notes', repairNotes || 'Crew initiated patching operations');
      await startRepairApi(report.id, formData);
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to start repair');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRepair = async () => {
    if (!afterImageFile) {
      setError('Evidence after-repair image is required.');
      return;
    }
    if (!repairNotes || repairNotes.length < 5) {
      setError('Repair completion notes are required.');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('notes', repairNotes);
      formData.append('afterImage', afterImageFile);
      await completeRepairApi(report.id, formData);
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to mark repair complete');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addCommentApi(report.id, commentText);
      setCommentText('');
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add comment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Top Title & Close */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Priority: {report.priority} ({report.priorityScore}/100)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Status: {report.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{report.title}</h2>
            <div className="flex items-center text-xs text-slate-400 space-x-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{report.address}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation Bar */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Overview & Status
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'ai'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explainable AI & Priority</span>
          </button>
          {['AUTHORITY', 'ADMIN', 'FIELD_WORKER'].includes(user?.role || '') && (
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'actions'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Workflow Controls</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'comments'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments ({report.comments?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <StatusTimeline
              status={report.status}
              createdAt={report.createdAt}
              verifiedAt={report.verifiedAt}
              completedAt={report.completedAt}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Reported Photo Evidence
                </span>
                <div className="h-64 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={report.imageUrl}
                    alt={report.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Map Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Geospatial Location
                </span>
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-800">
                  <PotholeMap reports={[report]} center={[report.latitude, report.longitude]} zoom={15} />
                </div>
              </div>
            </div>

            {/* Description & Reporter details */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Pothole Report Description
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{report.description}</p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>Reporter: {report.reporter?.name || 'Anonymous Citizen'}</span>
                <span>Submitted: {new Date(report.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Evidence Before/After if repaired */}
            {report.repairUpdates && report.repairUpdates.length > 0 && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Repair Field Updates & Evidence
                </span>
                <div className="space-y-3">
                  {report.repairUpdates.map((ru) => (
                    <div key={ru.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">
                          Worker: {ru.worker?.name || 'Field Crew'} ({ru.status})
                        </span>
                        <span className="text-slate-500">{new Date(ru.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-400">{ru.notes}</p>
                      {ru.afterImageUrl && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Before Repair</span>
                            <img src={ru.beforeImageUrl || report.imageUrl} className="h-28 w-full object-cover rounded-lg" />
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-400 font-semibold block mb-1">After Repair Evidence</span>
                            <img src={ru.afterImageUrl} className="h-28 w-full object-cover rounded-lg border border-emerald-500/40" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXPLAINABLE AI & PRIORITY */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Explainable AI & Priority Assessment</h4>
                  <p className="text-xs text-slate-400">Transparent breakdown of computer vision model and priority scoring formula</p>
                </div>
              </div>

              {/* AI Vision Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400 block">AI Detected Severity</span>
                  <span className="text-lg font-bold text-sky-400">{report.aiSeverity}</span>
                  <span className="text-xs text-slate-500 block mt-1">Score: {report.severityScore}/100</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400 block">AI Confidence Score</span>
                  <span className="text-lg font-bold text-emerald-400">{Math.round(report.confidenceScore * 100)}%</span>
                  <span className="text-xs text-slate-500 block mt-1">Model certainty rating</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400 block">Analysis Mode</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {report.isFallbackAnalysis ? 'Rule-Based AI Fallback' : 'Computer Vision Provider'}
                  </span>
                </div>
              </div>

              {/* AI Reason */}
              {report.aiReason && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-300 block">Vision Diagnostic Reason:</span>
                  <p className="text-slate-400">{report.aiReason}</p>
                </div>
              )}

              {/* Explainable Priority Formula */}
              <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-sky-400 font-bold">
                  <Info className="w-4 h-4" />
                  <span>Explainable Priority Score Calculation:</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {report.priorityExplanation}
                </p>
                <div className="text-[11px] text-slate-400 pt-1">
                  Formula: Priority = (Severity x 55%) + (AI Confidence x 20%) + (Location Impact x 15%) + (Unresolved Age x 10%)
                </div>
              </div>

              {/* Authority Override Section if present */}
              {report.authorityPriority && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Human Authority Priority Override Applied</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Original AI Priority</span>
                      <span className="font-semibold text-slate-300">{report.aiPriority} ({report.aiPriorityScore}/100)</span>
                    </div>
                    <div>
                      <span className="text-amber-400 text-[10px] block font-bold">Authority Override Priority</span>
                      <span className="font-bold text-amber-300">{report.authorityPriority}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-amber-500/20 text-slate-300">
                    <span className="font-semibold">Recorded Override Justification:</span> {report.authorityReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: WORKFLOW CONTROLS */}
        {activeTab === 'actions' && (
          <div className="space-y-6">
            {/* AUTHORITY & ADMIN ACTIONS */}
            {['AUTHORITY', 'ADMIN'].includes(user?.role || '') && (
              <div className="space-y-6">
                {/* Verification / Rejection Controls */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-sky-400" />
                    <span>Authority Review & Verification</span>
                  </h4>

                  <div className="flex flex-wrap gap-3">
                    {['SUBMITTED', 'UNDER_REVIEW'].includes(report.status) && (
                      <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/10"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify Pothole Report</span>
                      </button>
                    )}

                    {['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(report.status) && (
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection justification reason..."
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                        />
                        <button
                          onClick={handleReject}
                          disabled={loading}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Worker Assignment */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-purple-400" />
                    <span>Assign Field Worker Crew</span>
                  </h4>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    >
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.email})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignWorker}
                      disabled={loading || !selectedWorkerId}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-purple-500/10"
                    >
                      Assign Worker
                    </button>
                  </div>
                </div>

                {/* Priority Override */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Override Priority Level</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <select
                        value={overridePriorityVal}
                        onChange={(e) => setOverridePriorityVal(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Mandatory justification for overriding AI priority..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <button
                      onClick={handleOverridePriority}
                      disabled={loading}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                    >
                      Submit Priority Override
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FIELD WORKER ACTIONS */}
            {['FIELD_WORKER', 'ADMIN'].includes(user?.role || '') && (
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-sky-400" />
                  <span>Field Repair Worker Actions</span>
                </h4>

                {report.status === 'ASSIGNED' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAcceptJob}
                      disabled={loading}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                    >
                      Accept Assignment
                    </button>
                    <button
                      onClick={handleStartRepair}
                      disabled={loading}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                    >
                      Start Repair Operations
                    </button>
                  </div>
                )}

                {report.status === 'IN_PROGRESS' && (
                  <div className="space-y-4 border-t border-slate-800 pt-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Repair Completion Notes *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={repairNotes}
                        onChange={(e) => setRepairNotes(e.target.value)}
                        placeholder="e.g. Cold-mix patch laid, compacted, and sealed."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Evidence After-Repair Photo * (Required)
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setAfterImageFile(e.target.files?.[0] || null)}
                        className="text-xs text-slate-400"
                      />
                    </div>

                    <button
                      onClick={handleCompleteRepair}
                      disabled={loading}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      <span>Mark Work Completed</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMMENTS */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {report.comments?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No comments on this report yet.</p>
              ) : (
                report.comments?.map((c) => (
                  <div key={c.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-sky-400">
                        {c.user?.name} ({c.user?.role})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{c.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex space-x-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Comment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
