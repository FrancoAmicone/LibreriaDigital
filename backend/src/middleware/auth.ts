import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = {
            id: user.id,
            ...(user.email ? { email: user.email } : {}),
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

export const isActive = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { status: true }
        });

        if (!user || user.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Access denied. Account not active or pending approval.' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Security check failed' });
    }
};
