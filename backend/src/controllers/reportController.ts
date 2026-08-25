import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { analyzePotholeImage } from '../services/aiService';
import { calculatePriority } from '../services/priorityEngine';
import { createAuditLog } from '../services/auditService';
import { createNotification } from '../services/notificationService';
import { uploadImageToStorage, resolveImageUrl } from '../services/storageService';

const reportSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().min(3, 'Address is required'),
});

// State Machine transitions helper
const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
  UNDER_REVIEW: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'VERIFIED', 'REJECTED'],
  IN_PROGRESS: ['REPAIRED', 'ASSIGNED'],
  REPAIRED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
  REJECTED: [],
};

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Pothole image is required.' });
    }

    const validated = reportSchema.parse(req.body);
    
    // Upload image to Supabase Storage (or local fallback in offline dev)
    const imageUrl = await uploadImageToStorage(file, 'potholes');

    // 1. AI Analysis
    const aiResult = await analyzePotholeImage(imageUrl, validated.title, validated.description);

    // 2. Explainable Priority Calculation
    const priorityResult = calculatePriority(
      aiResult.severityScore,
      aiResult.confidenceScore,
      validated.address,
      new Date(),
      'PENDING'
    );

    // 3. Store Report
    const report = await prisma.potholeReport.create({
      data: {
        reporterId: req.user.id,
        title: validated.title,
        description: validated.description,
        latitude: validated.latitude,
        longitude: validated.longitude,
        address: validated.address,
        imageUrl,
        severity: aiResult.severity,
        severityScore: aiResult.severityScore,
        priority: priorityResult.priority,
        priorityScore: priorityResult.priorityScore,
        aiSeverity: aiResult.severity,
        aiPriority: priorityResult.priority,
        aiPriorityScore: priorityResult.priorityScore,
        confidenceScore: aiResult.confidenceScore,
        aiReason: aiResult.reason,
        isFallbackAnalysis: aiResult.isFallbackAnalysis,
        priorityExplanation: priorityResult.priorityExplanation,
        status: 'SUBMITTED',
        verificationStatus: 'PENDING',
      },
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 4. Create Audit Log
    await createAuditLog(req.user.id, 'REPORT_SUBMITTED', 'PotholeReport', report.id, {
      title: report.title,
      severity: report.severity,
      priority: report.priority,
    });

    // 5. Notify Authorities
    const authorities = await prisma.user.findMany({
      where: { role: 'AUTHORITY', isActive: true },
      select: { id: true },
    });

    for (const auth of authorities) {
      await createNotification(
        auth.id,
        'New Pothole Report Submitted',
        `New ${report.severity} severity pothole reported at ${report.address}`,
        'NEW_REPORT'
      );
    }

    const resolvedReport = {
      ...report,
      imageUrl: await resolveImageUrl(report.imageUrl),
    };

    return res.status(201).json({
      message: 'Pothole report submitted successfully',
      report: resolvedReport,
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      status,
      severity,
      priority,
      verificationStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    const where: any = {};

    // IDOR & Role Scope Enforcement
    if (req.user.role === 'CITIZEN') {
      where.reporterId = req.user.id;
    } else if (req.user.role === 'FIELD_WORKER') {
      // Workers see assigned jobs or verified reports
      where.OR = [
        { assignedWorkerId: req.user.id },
        { status: { in: ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REPAIRED'] } },
      ];
    }

    if (status) where.status = String(status);
    if (severity) where.severity = String(severity);
    if (priority) where.priority = String(priority);
    if (verificationStatus) where.verificationStatus = String(verificationStatus);

    if (search) {
      const queryStr = String(search);
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: queryStr } },
            { description: { contains: queryStr } },
            { address: { contains: queryStr } },
          ],
        },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [reports, total] = await Promise.all([
      prisma.potholeReport.findMany({
        where,
        skip,
        take,
        orderBy: { [String(sortBy)]: String(sortOrder) },
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          assignedWorker: { select: { id: true, name: true, phone: true } },
        },
      }),
      prisma.potholeReport.count({ where }),
    ]);

    const resolvedReports = await Promise.all(
      reports.map(async (r) => ({
        ...r,
        imageUrl: await resolveImageUrl(r.imageUrl),
      }))
    );

    return res.status(200).json({
      reports: resolvedReports,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const report = await prisma.potholeReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, email: true, phone: true } },
        assignedWorker: { select: { id: true, name: true, email: true, phone: true } },
        repairUpdates: {
          include: { worker: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Pothole report not found' });
    }

    // IDOR Prevention: Citizen can only access own report
    if (req.user.role === 'CITIZEN' && report.reporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this report.' });
    }

    const resolvedReport = {
      ...report,
      imageUrl: await resolveImageUrl(report.imageUrl),
      repairUpdates: await Promise.all(
        report.repairUpdates.map(async (u) => ({
          ...u,
          beforeImageUrl: await resolveImageUrl(u.beforeImageUrl),
          afterImageUrl: await resolveImageUrl(u.afterImageUrl),
        }))
      ),
    };

    return res.status(200).json({ report: resolvedReport });
  } catch (error) {
    next(error);
  }
};

export const verifyReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['AUTHORITY', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only authorities can verify reports.' });
    }

    const { id } = req.params;
    const report = await prisma.potholeReport.findUnique({ where: { id } });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (!VALID_TRANSITIONS[report.status].includes('VERIFIED')) {
      return res.status(400).json({ error: `Cannot verify report from current status: ${report.status}` });
    }

    const updated = await prisma.potholeReport.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    await createAuditLog(req.user.id, 'REPORT_VERIFIED', 'PotholeReport', report.id);
    await createNotification(
      report.reporterId,
      'Report Verified',
      `Your pothole report "${report.title}" has been verified by authority.`,
      'STATUS_UPDATE'
    );

    return res.status(200).json({ message: 'Report verified successfully', report: updated });
  } catch (error) {
    next(error);
  }
};

export const rejectReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['AUTHORITY', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only authorities can reject reports.' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const report = await prisma.potholeReport.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (!VALID_TRANSITIONS[report.status].includes('REJECTED')) {
      return res.status(400).json({ error: `Cannot reject report from current status: ${report.status}` });
    }

    const updated = await prisma.potholeReport.update({
      where: { id },
      data: {
        status: 'REJECTED',
        verificationStatus: 'REJECTED',
        authorityReason: reason || 'Rejected by authority inspection.',
      },
    });

    await createAuditLog(req.user.id, 'REPORT_REJECTED', 'PotholeReport', report.id, { reason });
    await createNotification(
      report.reporterId,
      'Report Rejected',
      `Your report "${report.title}" was reviewed and rejected. Reason: ${reason || 'Does not meet priority criteria.'}`,
      'STATUS_UPDATE'
    );

    return res.status(200).json({ message: 'Report rejected', report: updated });
  } catch (error) {
    next(error);
  }
};

export const assignWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['AUTHORITY', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only authorities can assign workers.' });
    }

    const { id } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({ error: 'workerId is required' });
    }

    const worker = await prisma.user.findUnique({ where: { id: workerId } });
    if (!worker || worker.role !== 'FIELD_WORKER') {
      return res.status(400).json({ error: 'Invalid field worker selected.' });
    }

    const report = await prisma.potholeReport.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updated = await prisma.potholeReport.update({
      where: { id },
      data: {
        assignedWorkerId: workerId,
        status: 'ASSIGNED',
      },
    });

    await createAuditLog(req.user.id, 'WORKER_ASSIGNED', 'PotholeReport', report.id, {
      assignedWorkerId: workerId,
      workerName: worker.name,
    });

    await createNotification(
      workerId,
      'New Repair Assignment',
      `You have been assigned to pothole job at ${report.address}.`,
      'JOB_ASSIGNED'
    );

    return res.status(200).json({ message: 'Worker assigned successfully', report: updated });
  } catch (error) {
    next(error);
  }
};

export const overridePriority = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['AUTHORITY', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only authorities can override priority.' });
    }

    const { id } = req.params;
    const { authorityPriority, authorityReason } = req.body;

    if (!authorityPriority || !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(authorityPriority)) {
      return res.status(400).json({ error: 'Valid priority level required (LOW, MEDIUM, HIGH, CRITICAL).' });
    }

    if (!authorityReason || authorityReason.length < 5) {
      return res.status(400).json({ error: 'A valid reason for priority override is required.' });
    }

    const report = await prisma.potholeReport.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updated = await prisma.potholeReport.update({
      where: { id },
      data: {
        priority: authorityPriority,
        authorityPriority,
        authorityReason,
      },
    });

    await createAuditLog(req.user.id, 'PRIORITY_OVERRIDDEN', 'PotholeReport', report.id, {
      originalAiPriority: report.aiPriority,
      newAuthorityPriority: authorityPriority,
      reason: authorityReason,
    });

    return res.status(200).json({ message: 'Priority overridden successfully', report: updated });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Comment message cannot be empty' });
    }

    const report = await prisma.potholeReport.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // IDOR Check
    if (req.user.role === 'CITIZEN' && report.reporterId !== req.user.id) {
      return res.status(403).json({ error: 'You can only comment on your own reports.' });
    }

    const comment = await prisma.comment.create({
      data: {
        reportId: id,
        userId: req.user.id,
        message: message.trim(),
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    await createAuditLog(req.user.id, 'COMMENT_ADDED', 'PotholeReport', report.id);

    return res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
};
