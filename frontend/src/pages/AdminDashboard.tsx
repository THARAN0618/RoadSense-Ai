import React, { useState, useEffect } from 'react';
import { User, AuditLog, AnalyticsData } from '../types';
import {
  getAdminUsersApi,
  updateUserStatusApi,
  getAuditLogsApi,
  getAnalyticsApi,
} from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  Users,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'audit'>('analytics');
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [userSearch, setUserSearch] = useState<string>('');
  const [selectedUserRole, setSelectedUserRole] = useState<string>('ALL');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsData, usersData, logsData] = await Promise.all([
        getAnalyticsApi(),
        getAdminUsersApi(),
        getAuditLogsApi(),
      ]);
      setAnalytics(analyticsData);
      setUsers(usersData.users);
      setAuditLogs(logsData.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (user: User) => {
    try {
      await updateUserStatusApi(user.id, { isActive: !user.isActive });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserStatusApi(userId, { role: newRole });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = selectedUserRole === 'ALL' || u.role === selectedUserRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-950 border border-purple-500/20 rounded-3xl p-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">System Administration Center</h2>
          </div>
          <p className="text-xs text-slate-400">
            Monitor real-time analytics, manage system users, configure roles, and inspect security audit logs.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors ${
            activeTab === 'analytics'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>System Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors ${
            activeTab === 'users'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors ${
            activeTab === 'audit'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Log Inspector</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 block">Total Pothole Reports</span>
              <span className="text-2xl font-bold text-white">{analytics.metrics.totalReports}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 block">Critical Hazards</span>
              <span className="text-2xl font-bold text-red-400">{analytics.metrics.criticalCount}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 block">Repaired / Resolved</span>
              <span className="text-2xl font-bold text-emerald-400">{analytics.metrics.repairedCount}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 block">Avg Resolution Time</span>
              <span className="text-2xl font-bold text-sky-400">{analytics.metrics.avgRepairHours} hrs</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown Bar Chart */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-white">Report Status Lifecycle Breakdown</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byStatus}>
                    <XAxis dataKey="status" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Severity Pie Chart */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-white">Severity Distribution</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.bySeverity}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ severity, count }) => `${severity}: ${count}`}
                    >
                      {analytics.bySeverity.map((entry) => (
                        <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || '#38bdf8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Filter Role:</span>
              {['ALL', 'CITIZEN', 'FIELD_WORKER', 'AUTHORITY', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedUserRole(r)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    selectedUserRole === r
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">{u.name}</td>
                    <td className="p-3.5 text-slate-400">{u.email}</td>
                    <td className="p-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="CITIZEN">CITIZEN</option>
                        <option value="FIELD_WORKER">FIELD_WORKER</option>
                        <option value="AUTHORITY">AUTHORITY</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          u.isActive
                            ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4 space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            System Security Audit Log Trail
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-purple-400">{log.action}</span>
                    <span className="text-slate-400">by {log.user?.name || 'System'} ({log.user?.role || 'N/A'})</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                {log.metadata && (
                  <pre className="text-[11px] text-slate-400 font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800 overflow-x-auto">
                    {log.metadata}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
