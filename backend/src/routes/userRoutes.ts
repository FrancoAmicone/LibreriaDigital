import { Router } from 'express';
import { getMe, syncUser, requestAccess, getAllUsers, approveUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Todas las rutas de usuario requieren autenticación
router.use(authenticate);

router.get('/me', getMe);
router.post('/sync', syncUser);
router.patch('/request-access', requestAccess);

// Rutas de Admin
router.get('/', getAllUsers);
router.patch('/:id/status', approveUser);

export default router;
