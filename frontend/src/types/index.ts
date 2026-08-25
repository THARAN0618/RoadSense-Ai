export type Role = 'CITIZEN' | 'FIELD_WORKER' | 'AUTHORITY' | 'ADMIN';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'REPAIRED'
  | 'CLOSED'
  | 'REJECTED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  _count?: {
    reports: number;
    assignedJobs: number;
  };
}

export interface PotholeReport {
  id: string;
  reporterId: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl: string;
  
  severity: SeverityLevel;
  severityScore: number;
  priority: PriorityLevel;
  priorityScore: number;
  
  aiSeverity: SeverityLevel;
  aiPriority: PriorityLevel;
  aiPriorityScore: number;
  confidenceScore: number;
  aiReason?: string;
  isFallbackAnalysis: boolean;
  priorityExplanation?: string;
  
  authorityPriority?: PriorityLevel;
  authorityReason?: string;

  status: ReportStatus;
  verificationStatus: VerificationStatus;
  
  assignedWorkerId?: string;
  assignedWorker?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };

  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  completedAt?: string;

  repairUpdates?: RepairUpdate[];
  comments?: Comment[];
}

export interface RepairUpdate {
  id: string;
  reportId: string;
  workerId: string;
  worker?: {
    id: string;
    name: string;
  };
  status: ReportStatus;
  notes: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    role: Role;
  };
  message: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  action: string;
  entityType: string;
  entityId: string;
  metadata?: string;
  createdAt: string;
}

export interface AnalyticsData {
  metrics: {
    totalReports: number;
    pendingCount: number;
    verifiedCount: number;
    inProgressCount: number;
    repairedCount: number;
    rejectedCount: number;
    criticalCount: number;
    highPriorityCount: number;
    avgRepairHours: number;
  };
  bySeverity: { severity: SeverityLevel; count: number }[];
  byStatus: { status: ReportStatus; count: number }[];
}
