import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        console.log(`[Notification] Fetching notifications for user: ${userId}`);

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`[Notification] Found ${notifications.length} notifications for user: ${userId}`);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user.id;

        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        res.json(updatedNotification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};
