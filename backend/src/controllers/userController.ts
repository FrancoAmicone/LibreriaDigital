import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middleware/auth.js';

export const getMe = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                ownedBooks: true,
                heldBooks: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found in database' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user profile', details: error });
    }
};

export const syncUser = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        console.error('[syncUser] No user in request');
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, image, email } = req.body;
    console.log(`[syncUser] Syncing user: ${req.user.id}`, { name, email });

    try {
        const user = await prisma.user.upsert({
            where: { id: req.user.id },
            update: {
                name: name || undefined,
                image: image || undefined,
                email: email || req.user.email || '',
            },
            create: {
                id: req.user.id,
                name: name || '',
                email: email || req.user.email || '',
                image: image || '',
                role: 'USER',
                status: 'PENDING',
            },
        });

        console.log(`[syncUser] Successfully synced user: ${user.id} with status: ${user.status}`);
        res.json(user);
    } catch (error) {
        console.error('[syncUser] Error syncing user:', error);
        res.status(500).json({ error: 'Error syncing user', details: error });
    }
};

export const requestAccess = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { status: 'PENDING' }, // En caso de que haya sido rechazado o esté en otro estado
        });

        res.json({ message: 'Access requested successfully', status: user.status });
    } catch (error) {
        res.status(500).json({ error: 'Error requesting access', details: error });
    }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    // Solo un ADMIN puede ver la lista de usuarios
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const admin = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (admin?.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can view users' });

        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
};

export const approveUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // 'ACTIVE' o 'PENDING'

    console.log(`[approveUser] Attempting to update user ${id} to status ${status}`);

    if (!id || typeof id !== 'string') {
        console.error('[approveUser] Invalid user ID provided');
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (!req.user) {
        console.error('[approveUser] Not authenticated');
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const admin = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (admin?.role !== 'ADMIN') {
            console.warn(`[approveUser] Unauthorized attempt by user ${req.user.id}`);
            return res.status(403).json({ error: 'Only admins can update users' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { status },
        });

        console.log(`[approveUser] Successfully updated user ${id} to ${status}`);
        res.json({ message: `User status updated to ${status}`, user });
    } catch (error) {
        console.error('[approveUser] Error updating user status:', error);
        res.status(500).json({ error: 'Error updating user status' });
    }
};
