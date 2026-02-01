import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middleware/auth.js';

export const getBooks = async (req: AuthRequest, res: Response) => {
    try {
        const books = await prisma.book.findMany({
            include: {
                owner: { select: { name: true, image: true } },
                currentHolder: { select: { name: true, image: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching books', details: error });
    }
};

export const getBookById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid book ID' });

    try {
        const book = await prisma.book.findUnique({
            where: { id },
            include: {
                owner: { select: { name: true, image: true } },
                currentHolder: { select: { name: true, image: true } },
            },
        });
        if (!book) return res.status(404).json({ error: 'Book not found' });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching book', details: error });
    }
};

export const addBook = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { title, author, isbn, thumbnail } = req.body;

    try {
        const book = await prisma.book.create({
            data: {
                title,
                author,
                isbn,
                thumbnail,
                ownerId: req.user.id,
                currentHolderId: req.user.id,
            },
        });
        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ error: 'Error creating book', details: error });
    }
};

export const transferBook = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { newHolderId } = req.body;

    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid book ID' });

    try {
        const book = await prisma.book.findUnique({ where: { id } });
        if (!book) return res.status(404).json({ error: 'Book not found' });

        // Solo el poseedor actual puede transferir
        if (book.currentHolderId !== req.user?.id) {
            return res.status(403).json({ error: 'Only the current holder can transfer this book' });
        }

        const updatedBook = await prisma.book.update({
            where: { id },
            data: { currentHolderId: newHolderId },
        });
        res.json(updatedBook);
    } catch (error) {
        res.status(500).json({ error: 'Error transferring book', details: error });
    }
};

export const deleteBook = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid book ID' });

    try {
        const book = await prisma.book.findUnique({ where: { id } });
        if (!book) return res.status(404).json({ error: 'Book not found' });

        // Solo el dueño puede eliminar
        if (book.ownerId !== req.user?.id) {
            return res.status(403).json({ error: 'Only the owner can delete this book' });
        }

        await prisma.book.delete({ where: { id } });
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting book', details: error });
    }
};
