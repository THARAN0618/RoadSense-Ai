import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  CheckSquare,
  Wrench,
  Users,
  ShieldCheck,
  BarChart3,
  FileText,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReportModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenReportModal }) => {
  const { user } = useAuth();
  const role = user?.role;

  const getNavItems = () => {
    switch (role) {
      case 'CITIZEN':
        return [
          { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { id: 'map', label: 'Interactive Map', icon: MapPin },
        ];
      case 'FIELD_WORKER':
        return [
          { id: 'jobs', label: 'Assigned Jobs', icon: Wrench },
          { id: 'map', label: 'Repair Map', icon: MapPin },
        ];
      case 'AUTHORITY':
        return [
          { id: 'authority', label: 'Authority Portal', icon: ShieldCheck },
          { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
          { id: 'map', label: 'Geospatial Map', icon: MapPin },
          { id: 'audit', label: 'Audit Logs', icon: FileText },
        ];
      case 'ADMIN':
        return [
          { id: 'admin-overview', label: 'System Overview', icon: LayoutDashboard },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'map', label: 'Map View', icon: MapPin },
          { id: 'audit', label: 'Audit Log Inspector', icon: FileText },
        ];
      default:
        return [{ id: 'map', label: 'Map View', icon: MapPin }];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* User Role Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
            {user?.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-400 tracking-wide capitalize">
              {role?.replace('_', ' ').toLowerCase()} Account
            </div>
          </div>
        </div>

        {/* Quick Action button for citizen */}
        {role === 'CITIZEN' && onOpenReportModal && (
          <button
            onClick={onOpenReportModal}
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/10 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Pothole Report</span>
          </button>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1">
          <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status info */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center space-x-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Operational</span>
        </div>
      </div>
    </aside>
  );
};
