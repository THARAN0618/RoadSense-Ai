import { prisma } from '../config/prisma.js';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'INFO'
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false,
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
