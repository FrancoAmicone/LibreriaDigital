import { Router } from 'express';
import {
    createRequest,
    getMyRequests,
    getRequestsForMyBooks,
    approveRequest,
    rejectRequest,
    markAsDelivered,
    markAsReturned,
    cancelRequest,
} from '../controllers/lendingRequestController.js';
import { authenticate, isActive } from '../middleware/auth.js';

const router = Router();

// All lending request routes require authentication and active status
router.use(authenticate);
router.use(isActive);

router.post('/', createRequest);
router.get('/my-requests', getMyRequests);
router.get('/for-my-books', getRequestsForMyBooks);
router.patch('/:id/approve', approveRequest);
router.patch('/:id/reject', rejectRequest);
router.patch('/:id/deliver', markAsDelivered);
router.patch('/:id/return', markAsReturned);
router.delete('/:id', cancelRequest);

export default router;
