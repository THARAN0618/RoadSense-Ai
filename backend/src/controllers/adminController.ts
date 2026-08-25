import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { createAuditLog } from '../services/auditService';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access restricted to administrators.' });
    }

    const { role, isActive, search, page = '1', limit = '20' } = req.query;
    const where: any = {};

    if (role) where.role = String(role);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      const q = String(search);
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              reports: true,
              assignedJobs: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      users,
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

export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access restricted to administrators.' });
    }

    const { id } = req.params;
    const { isActive, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (id === req.user.id && isActive === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own active admin account.' });
    }

    const dataToUpdate: any = {};
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (role && ['CITIZEN', 'FIELD_WORKER', 'AUTHORITY', 'ADMIN'].includes(role)) {
      dataToUpdate.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await createAuditLog(req.user.id, 'USER_STATUS_UPDATED', 'User', id, dataToUpdate);

    return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['ADMIN', 'AUTHORITY'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access restricted to administrators and authorities.' });
    }

    const { entityType, action, page = '1', limit = '50' } = req.query;
    const where: any = {};

    if (entityType) where.entityType = String(entityType);
    if (action) where.action = String(action);

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      logs,
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

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['ADMIN', 'AUTHORITY'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access restricted to administrators and authorities.' });
    }

    const [
      totalReports,
      pendingCount,
      verifiedCount,
      inProgressCount,
      repairedCount,
      rejectedCount,
      criticalCount,
      highPriorityCount,
      bySeverityGroup,
      byStatusGroup,
      repairedReportsWithDates,
    ] = await Promise.all([
      prisma.potholeReport.count(),
      prisma.potholeReport.count({ where: { status: 'SUBMITTED' } }),
      prisma.potholeReport.count({ where: { status: 'VERIFIED' } }),
      prisma.potholeReport.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.potholeReport.count({ where: { status: 'REPAIRED' } }),
      prisma.potholeReport.count({ where: { status: 'REJECTED' } }),
      prisma.potholeReport.count({ where: { severity: 'CRITICAL' } }),
      prisma.potholeReport.count({ where: { priority: { in: ['HIGH', 'CRITICAL'] } } }),
      prisma.potholeReport.groupBy({
        by: ['severity'],
        _count: { id: true },
      }),
      prisma.potholeReport.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.potholeReport.findMany({
        where: {
          status: 'REPAIRED',
          completedAt: { not: null },
        },
        select: { createdAt: true, completedAt: true },
      }),
    ]);

    // Average repair time calculation in hours
    let avgRepairHours = 0;
    if (repairedReportsWithDates.length > 0) {
      const totalHours = repairedReportsWithDates.reduce((acc, r) => {
        if (r.completedAt) {
          const diffMs = new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime();
          return acc + diffMs / (1000 * 60 * 60);
        }
        return acc;
      }, 0);
      avgRepairHours = Math.round((totalHours / repairedReportsWithDates.length) * 10) / 10;
    }

    return res.status(200).json({
      metrics: {
        totalReports,
        pendingCount,
        verifiedCount,
        inProgressCount,
        repairedCount,
        rejectedCount,
        criticalCount,
        highPriorityCount,
        avgRepairHours,
      },
      bySeverity: bySeverityGroup.map((g) => ({ severity: g.severity, count: g._count.id })),
      byStatus: byStatusGroup.map((g) => ({ status: g.status, count: g._count.id })),
    });
  } catch (error) {
    next(error);
  }
};
