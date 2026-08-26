import { Router } from 'express';
import { getUsers, updateUserStatus, getAuditLogs, getAnalytics } from '../controllers/adminController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/users', getUsers);
router.patch('/users/:id', updateUserStatus);
router.get('/audit-logs', getAuditLogs);
router.get('/analytics', getAnalytics);

export default router;
