import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Importar Rutas
import userRoutes from './routes/userRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import lendingRequestRoutes from './routes/lendingRequestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Usar Rutas
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/lending-requests', lendingRequestRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', async (req: Request, res: Response) => {
    try {
        // Ping a la DB para corroborar conexión
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', message: 'LibreShare API is running', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'LibreShare API is running', database: 'disconnected', error });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
