import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { createAuditLog } from '../services/auditService';
import { createNotification } from '../services/notificationService';
import { uploadImageToStorage, resolveImageUrl } from '../services/storageService';

export const getAssignedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['FIELD_WORKER', 'AUTHORITY', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access restricted to field workers.' });
    }

    const workerId = req.user.role === 'FIELD_WORKER' ? req.user.id : (req.query.workerId as string) || req.user.id;

    const jobs = await prisma.potholeReport.findMany({
      where: {
        assignedWorkerId: workerId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REPAIRED'] },
      },
      orderBy: [
        { priorityScore: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        reporter: { select: { id: true, name: true, phone: true } },
        repairUpdates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const resolvedJobs = await Promise.all(
      jobs.map(async (job) => ({
        ...job,
        imageUrl: await resolveImageUrl(job.imageUrl),
        repairUpdates: await Promise.all(
          job.repairUpdates.map(async (u) => ({
            ...u,
            beforeImageUrl: await resolveImageUrl(u.beforeImageUrl),
            afterImageUrl: await resolveImageUrl(u.afterImageUrl),
          }))
        ),
      }))
    );

    return res.status(200).json({ jobs: resolvedJobs });
  } catch (error) {
    next(error);
  }
};

export const acceptJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['FIELD_WORKER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access restricted to field workers.' });
    }

    const { id } = req.params;
    const report = await prisma.potholeReport.findUnique({ where: { id } });

    if (!report) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // IDOR Check: Worker can only accept jobs assigned to them
    if (req.user.role === 'FIELD_WORKER' && report.assignedWorkerId !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this repair job.' });
    }

    const updated = await prisma.potholeReport.update({
      where: { id },
      data: { status: 'ASSIGNED' },
    });

    await createAuditLog(req.user.id, 'JOB_ACCEPTED', 'PotholeReport', id);

    return res.status(200).json({ message: 'Job accepted', report: updated });
  } catch (error) {
    next(error);
  }
};

export const startRepair = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['FIELD_WORKER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access restricted to field workers.' });
    }

    const { id } = req.params;
    const { notes } = req.body;
    const file = req.file;

    const report = await prisma.potholeReport.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (req.user.role === 'FIELD_WORKER' && report.assignedWorkerId !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this repair job.' });
    }

    const beforeImageUrl = file ? await uploadImageToStorage(file, 'repairs') : report.imageUrl;

    const updatedReport = await prisma.potholeReport.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });

    const updateRecord = await prisma.repairUpdate.create({
      data: {
        reportId: id,
        workerId: req.user.id,
        status: 'IN_PROGRESS',
        notes: notes || 'Repair crew arrived on scene and initiated patching.',
        beforeImageUrl,
      },
    });

    await createAuditLog(req.user.id, 'REPAIR_STARTED', 'PotholeReport', id, { notes });
    await createNotification(
      report.reporterId,
      'Repair In Progress',
      `Field worker has arrived at ${report.address} and started repairing your reported pothole.`,
      'STATUS_UPDATE'
    );

    return res.status(200).json({
      message: 'Repair started',
      report: { ...updatedReport, imageUrl: await resolveImageUrl(updatedReport.imageUrl) },
      updateRecord: {
        ...updateRecord,
        beforeImageUrl: await resolveImageUrl(updateRecord.beforeImageUrl),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const completeRepair = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['FIELD_WORKER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access restricted to field workers.' });
    }

    const { id } = req.params;
    const { notes } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Evidence after-repair image is required to mark job as REPAIRED.' });
    }

    if (!notes || notes.trim().length < 5) {
      return res.status(400).json({ error: 'Repair completion notes are required.' });
    }

    const report = await prisma.potholeReport.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (req.user.role === 'FIELD_WORKER' && report.assignedWorkerId !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this repair job.' });
    }

    const afterImageUrl = await uploadImageToStorage(file, 'repairs');

    const updatedReport = await prisma.potholeReport.update({
      where: { id },
      data: {
        status: 'REPAIRED',
        completedAt: new Date(),
      },
    });

    const updateRecord = await prisma.repairUpdate.create({
      data: {
        reportId: id,
        workerId: req.user.id,
        status: 'REPAIRED',
        notes: notes.trim(),
        beforeImageUrl: report.imageUrl,
        afterImageUrl,
      },
    });

    await createAuditLog(req.user.id, 'REPAIR_COMPLETED', 'PotholeReport', id, { notes, afterImageUrl });

    // Notify Reporter & Authorities
    await createNotification(
      report.reporterId,
      'Repair Completed 🎉',
      `Great news! The pothole at ${report.address} has been successfully repaired by the field crew.`,
      'STATUS_UPDATE'
    );

    return res.status(200).json({
      message: 'Repair marked as completed successfully',
      report: { ...updatedReport, imageUrl: await resolveImageUrl(updatedReport.imageUrl) },
      updateRecord: {
        ...updateRecord,
        beforeImageUrl: await resolveImageUrl(updateRecord.beforeImageUrl),
        afterImageUrl: await resolveImageUrl(updateRecord.afterImageUrl),
      },
    });
  } catch (error) {
    next(error);
  }
};
