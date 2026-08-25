import React from 'react';
import { ReportStatus } from '../types';
import { Check, Clock, XCircle, Wrench, ShieldCheck, UserCheck } from 'lucide-react';

interface StatusTimelineProps {
  status: ReportStatus;
  createdAt: string;
  verifiedAt?: string;
  completedAt?: string;
}

const STEPS: { status: ReportStatus; label: string; icon: any }[] = [
  { status: 'SUBMITTED', label: 'Submitted', icon: Clock },
  { status: 'VERIFIED', label: 'Verified', icon: ShieldCheck },
  { status: 'ASSIGNED', label: 'Worker Assigned', icon: UserCheck },
  { status: 'IN_PROGRESS', label: 'In Progress', icon: Wrench },
  { status: 'REPAIRED', label: 'Repaired', icon: Check },
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  status,
  createdAt,
  verifiedAt,
  completedAt,
}) => {
  if (status === 'REJECTED') {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-red-400">Report Rejected</h4>
        <p className="text-xs text-slate-400">This report was inspected by municipal authority and marked as rejected.</p>
      </div>
    );
  }

  const getStepIndex = (st: ReportStatus) => {
    switch (st) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 0;
      case 'VERIFIED':
        return 1;
      case 'ASSIGNED':
        return 2;
      case 'IN_PROGRESS':
        return 3;
      case 'REPAIRED':
      case 'CLOSED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
        Repair Status Timeline
      </div>

      <div className="relative flex items-center justify-between">
        {/* Connection Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800 z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500 z-0"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCurrent
                    ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-lg shadow-sky-500/40 ring-4 ring-sky-500/20 scale-110'
                    : isDone
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span
                className={`text-[10px] sm:text-xs font-semibold mt-2 text-center max-w-[70px] ${
                  isCurrent ? 'text-sky-400 font-bold' : isDone ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
