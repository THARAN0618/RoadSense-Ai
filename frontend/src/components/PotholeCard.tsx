import React from 'react';
import { PotholeReport, PriorityLevel, SeverityLevel, ReportStatus } from '../types';
import { MapPin, Calendar, Sparkles, ChevronRight, ShieldAlert } from 'lucide-react';

interface PotholeCardProps {
  report: PotholeReport;
  onSelect: (report: PotholeReport) => void;
}

export const PotholeCard: React.FC<PotholeCardProps> = ({ report, onSelect }) => {
  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border-red-500/30 ring-1 ring-red-500/20 shadow-sm shadow-red-500/10';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-950 text-yellow-300 border-yellow-800';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'REPAIRED':
      case 'CLOSED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse';
      case 'ASSIGNED':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'VERIFIED':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'REJECTED':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div
      onClick={() => onSelect(report)}
      className="group bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-sky-500/5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Image Preview & Badges Header */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-950">
          <img
            src={report.imageUrl}
            alt={report.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border backdrop-blur-md ${getPriorityBadge(
                report.priority
              )}`}
            >
              Priority: {report.priority} ({report.priorityScore}/100)
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border backdrop-blur-md ${getStatusBadge(
                report.status
              )}`}
            >
              {report.status.replace('_', ' ')}
            </span>
          </div>

          {/* AI Confidence Indicator */}
          <div className="absolute bottom-2 left-3 flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px]">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span className="text-slate-300">AI Confidence:</span>
            <span className="font-bold text-sky-400">{Math.round(report.confidenceScore * 100)}%</span>
            {report.isFallbackAnalysis && (
              <span className="text-slate-500 text-[9px] font-medium ml-1">(Fallback)</span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors line-clamp-1">
              {report.title}
            </h3>
          </div>

          <div className="flex items-center text-xs text-slate-400 space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">{report.address}</span>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{report.description}</p>

          {/* Authority Override Indicator if applicable */}
          {report.authorityPriority && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-[11px] text-amber-300 flex items-center space-x-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Authority Override: {report.authorityPriority}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 pt-0 border-t border-slate-800/40 mt-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-1 text-sky-400 group-hover:translate-x-1 transition-transform font-medium">
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
