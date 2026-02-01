import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middleware/auth.js';

// Create a lending request
export const createRequest = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { bookId } = req.body;

    if (!bookId || typeof bookId !== 'string') {
        return res.status(400).json({ error: 'Invalid book ID' });
    }

    try {
        // Check if book exists and is available
        const book = await prisma.book.findUnique({ where: { id: bookId } });
        if (!book) return res.status(404).json({ error: 'Book not found' });

        // Can't request your own book
        if (book.ownerId === req.user.id) {
            return res.status(400).json({ error: 'Cannot request your own book' });
        }

        // Check if there's already a pending or approved request
        const existingRequest = await prisma.lendingRequest.findFirst({
            where: {
                bookId,
                requesterId: req.user.id,
                status: { in: ['PENDING', 'APPROVED', 'DELIVERED'] },
            },
        });

        if (existingRequest) {
            return res.status(400).json({
                error: 'You already have an active request for this book',
                existingRequest
            });
        }

        const lendingRequest = await prisma.lendingRequest.create({
            data: {
                bookId,
                requesterId: req.user.id,
            },
            include: {
                book: {
                    include: {
                        owner: { select: { name: true, image: true } },
                    },
                },
                requester: { select: { name: true, image: true } },
            },
        });

        res.status(201).json(lendingRequest);
    } catch (error) {
        console.error('Error creating lending request:', error);
        res.status(500).json({ error: 'Error creating lending request', details: error });
    }
};

// Get my requests (requests I made)
export const getMyRequests = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const requests = await prisma.lendingRequest.findMany({
            where: { requesterId: req.user.id },
            include: {
                book: {
                    include: {
                        owner: { select: { name: true, image: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching requests', details: error });
    }
};

// Get requests for my books (requests others made for my books)
export const getRequestsForMyBooks = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const requests = await prisma.lendingRequest.findMany({
            where: {
                book: { ownerId: req.user.id },
            },
            include: {
                book: true,
                requester: { select: { name: true, image: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching requests', details: error });
    }
};

// Approve a request (owner only)
export const approveRequest = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid request ID' });
    }

    try {
        const lendingRequest = await prisma.lendingRequest.findUnique({
            where: { id },
            include: { book: true },
        });

        if (!lendingRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Only the book owner can approve
        if (lendingRequest.book.ownerId !== req.user?.id) {
            return res.status(403).json({ error: 'Only the book owner can approve this request' });
        }

        if (lendingRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending requests can be approved' });
        }

        const updatedRequest = await prisma.lendingRequest.update({
            where: { id },
            data: { status: 'APPROVED' },
            include: {
                book: {
                    include: {
                        owner: { select: { name: true, image: true } },
                    },
                },
                requester: { select: { name: true, image: true } },
            },
        });

        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ error: 'Error approving request', details: error });
    }
};

// Reject a request (owner only)
export const rejectRequest = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid request ID' });
    }

    try {
        const lendingRequest = await prisma.lendingRequest.findUnique({
            where: { id },
            include: { book: true },
        });

        if (!lendingRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Only the book owner can reject
        if (lendingRequest.book.ownerId !== req.user?.id) {
            return res.status(403).json({ error: 'Only the book owner can reject this request' });
        }

        if (lendingRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending requests can be rejected' });
        }

        const updatedRequest = await prisma.lendingRequest.update({
            where: { id },
            data: { status: 'REJECTED' },
            include: {
                book: {
                    include: {
                        owner: { select: { name: true, image: true } },
                    },
                },
                requester: { select: { name: true, image: true } },
            },
        });

        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ error: 'Error rejecting request', details: error });
    }
};

// Mark as delivered (owner only)
export const markAsDelivered = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid request ID' });
    }

    try {
        const lendingRequest = await prisma.lendingRequest.findUnique({
            where: { id },
            include: { book: true },
        });

        if (!lendingRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Only the book owner can mark as delivered
        if (lendingRequest.book.ownerId !== req.user?.id) {
            return res.status(403).json({ error: 'Only the book owner can mark as delivered' });
        }

        if (lendingRequest.status !== 'APPROVED') {
            return res.status(400).json({ error: 'Only approved requests can be marked as delivered' });
        }

        // Update request status and book holder
        const [updatedRequest] = await prisma.$transaction([
            prisma.lendingRequest.update({
                where: { id },
                data: { status: 'DELIVERED' },
                include: {
                    book: {
                        include: {
                            owner: { select: { name: true, image: true } },
                        },
                    },
                    requester: { select: { name: true, image: true } },
                },
            }),
            prisma.book.update({
                where: { id: lendingRequest.bookId },
                data: {
                    currentHolderId: lendingRequest.requesterId,
                    isAvailable: false,
                },
            }),
        ]);

        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ error: 'Error marking as delivered', details: error });
    }
};

// Mark as returned (owner only)
export const markAsReturned = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid request ID' });
    }

    try {
        const lendingRequest = await prisma.lendingRequest.findUnique({
            where: { id },
            include: { book: true },
        });

        if (!lendingRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Only the book owner can mark as returned
        if (lendingRequest.book.ownerId !== req.user?.id) {
            return res.status(403).json({ error: 'Only the book owner can mark as returned' });
        }

        if (lendingRequest.status !== 'DELIVERED') {
            return res.status(400).json({ error: 'Only delivered books can be marked as returned' });
        }

        // Update request status and book holder
        const [updatedRequest] = await prisma.$transaction([
            prisma.lendingRequest.update({
                where: { id },
                data: { status: 'RETURNED' },
                include: {
                    book: {
                        include: {
                            owner: { select: { name: true, image: true } },
                        },
                    },
                    requester: { select: { name: true, image: true } },
                },
            }),
            prisma.book.update({
                where: { id: lendingRequest.bookId },
                data: {
                    currentHolderId: lendingRequest.book.ownerId,
                    isAvailable: true,
                },
            }),
        ]);

        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ error: 'Error marking as returned', details: error });
    }
};

// Cancel a request (requester only)
export const cancelRequest = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid request ID' });
    }

    try {
        const lendingRequest = await prisma.lendingRequest.findUnique({
            where: { id },
        });

        if (!lendingRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Only the requester can cancel
        if (lendingRequest.requesterId !== req.user?.id) {
            return res.status(403).json({ error: 'Only the requester can cancel this request' });
        }

        if (!['PENDING', 'APPROVED'].includes(lendingRequest.status)) {
            return res.status(400).json({ error: 'Only pending or approved requests can be cancelled' });
        }

        const updatedRequest = await prisma.lendingRequest.update({
            where: { id },
            data: { status: 'CANCELLED' },
            include: {
                book: {
                    include: {
                        owner: { select: { name: true, image: true } },
                    },
                },
                requester: { select: { name: true, image: true } },
            },
        });

        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ error: 'Error cancelling request', details: error });
    }
};
