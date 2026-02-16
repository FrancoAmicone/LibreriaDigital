import { prisma } from '../lib/prisma.js';

/**
 * Creates a notification without blocking or crashing the main process.
 */
export async function createSafeNotification(data: {
    userId: string;
    message: string;
    type: string;
}) {
    try {
        console.log(`[Notification Service] Attempting to create ${data.type} notification for user ${data.userId}`);
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                message: data.message,
                type: data.type,
            },
        });
        console.log(`[Notification Service] Successfully created notification: ${notification.id}`);
        return notification;
    } catch (error) {
        console.error(`[Notification Service Error] Failed to create notification:`, error);
        // We don't throw here to prevent the main controller from failing
        return null;
    }
}
