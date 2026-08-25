import axios from 'axios';
import {
  User,
  PotholeReport,
  Notification,
  AuditLog,
  AnalyticsData,
  Comment,
  RepairUpdate,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const loginApi = async (credentials: any) => {
  const res = await api.post<{ message: string; user: User }>('/auth/login', credentials);
  return res.data;
};

export const registerApi = async (data: any) => {
  const res = await api.post<{ message: string; user: User }>('/auth/register', data);
  return res.data;
};

export const logoutApi = async () => {
  const res = await api.post<{ message: string }>('/auth/logout');
  return res.data;
};

export const getMeApi = async () => {
  const res = await api.get<{ user: User }>('/auth/me');
  return res.data;
};

// Reports API
export const getReportsApi = async (params?: Record<string, any>) => {
  const res = await api.get<{ reports: PotholeReport[]; pagination: any }>('/reports', { params });
  return res.data;
};

export const getReportByIdApi = async (id: string) => {
  const res = await api.get<{ report: PotholeReport }>(`/reports/${id}`);
  return res.data;
};

export const createReportApi = async (formData: FormData) => {
  const res = await api.post<{ message: string; report: PotholeReport }>('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const verifyReportApi = async (id: string) => {
  const res = await api.post<{ message: string; report: PotholeReport }>(`/reports/${id}/verify`);
  return res.data;
};

export const rejectReportApi = async (id: string, reason: string) => {
  const res = await api.post<{ message: string; report: PotholeReport }>(`/reports/${id}/reject`, { reason });
  return res.data;
};

export const assignWorkerApi = async (id: string, workerId: string) => {
  const res = await api.post<{ message: string; report: PotholeReport }>(`/reports/${id}/assign`, { workerId });
  return res.data;
};

export const overridePriorityApi = async (id: string, authorityPriority: string, authorityReason: string) => {
  const res = await api.patch<{ message: string; report: PotholeReport }>(`/reports/${id}`, {
    authorityPriority,
    authorityReason,
  });
  return res.data;
};

export const addCommentApi = async (id: string, message: string) => {
  const res = await api.post<{ comment: Comment }>(`/reports/${id}/comments`, { message });
  return res.data;
};

// Worker API
export const getAssignedJobsApi = async (workerId?: string) => {
  const res = await api.get<{ jobs: PotholeReport[] }>('/workers/jobs', { params: { workerId } });
  return res.data;
};

export const acceptJobApi = async (id: string) => {
  const res = await api.post<{ message: string; report: PotholeReport }>(`/workers/jobs/${id}/accept`);
  return res.data;
};

export const startRepairApi = async (id: string, formData: FormData) => {
  const res = await api.post<{ message: string; report: PotholeReport; updateRecord: RepairUpdate }>(
    `/workers/jobs/${id}/start`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
};

export const completeRepairApi = async (id: string, formData: FormData) => {
  const res = await api.post<{ message: string; report: PotholeReport; updateRecord: RepairUpdate }>(
    `/workers/jobs/${id}/repair`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
};

// Notification API
export const getNotificationsApi = async () => {
  const res = await api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications');
  return res.data;
};

export const markNotificationReadApi = async (id: string) => {
  const res = await api.patch<{ notification: Notification }>(`/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsReadApi = async () => {
  const res = await api.post<{ message: string }>('/notifications/read-all');
  return res.data;
};

// Admin API
export const getAdminUsersApi = async (params?: Record<string, any>) => {
  const res = await api.get<{ users: User[]; pagination: any }>('/admin/users', { params });
  return res.data;
};

export const updateUserStatusApi = async (id: string, data: { isActive?: boolean; role?: string }) => {
  const res = await api.patch<{ message: string; user: User }>(`/admin/users/${id}`, data);
  return res.data;
};

export const getAuditLogsApi = async (params?: Record<string, any>) => {
  const res = await api.get<{ logs: AuditLog[]; pagination: any }>('/admin/audit-logs', { params });
  return res.data;
};

export const getAnalyticsApi = async () => {
  const res = await api.get<AnalyticsData>('/admin/analytics');
  return res.data;
};

export default api;
