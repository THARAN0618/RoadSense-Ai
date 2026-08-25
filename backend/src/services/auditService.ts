import { prisma } from '../config/prisma.js';

export async function createAuditLog(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log entry:', err);
  }
}
