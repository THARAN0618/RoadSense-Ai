import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  verifyReport,
  rejectReport,
  assignWorker,
  overridePriority,
  addComment,
} from '../controllers/reportController';
import { requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(requireAuth);

router.post('/', upload.single('image'), createReport);
router.get('/', getReports);
router.get('/:id', getReportById);

router.post('/:id/verify', requireRole('AUTHORITY', 'ADMIN'), verifyReport);
router.post('/:id/reject', requireRole('AUTHORITY', 'ADMIN'), rejectReport);
router.post('/:id/assign', requireRole('AUTHORITY', 'ADMIN'), assignWorker);
router.patch('/:id', requireRole('AUTHORITY', 'ADMIN'), overridePriority);

router.post('/:id/comments', addComment);

export default router;
