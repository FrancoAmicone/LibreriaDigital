import { Router } from 'express';
import { getBooks, getBookById, addBook, deleteBook, updateBook } from '../controllers/bookController.js';
import { authenticate, isActive } from '../middleware/auth.js';

const router = Router();

// Todas las rutas de libros requieren autenticación y estar ACTIVO
router.use(authenticate);
router.use(isActive);

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', addBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

export default router;
