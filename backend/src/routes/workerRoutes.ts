import { Router } from 'express';
import { getAssignedJobs, acceptJob, startRepair, completeRepair } from '../controllers/workerController';
import { requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(requireAuth);
router.use(requireRole('FIELD_WORKER', 'AUTHORITY', 'ADMIN'));

router.get('/jobs', getAssignedJobs);
router.post('/jobs/:id/accept', acceptJob);
router.post('/jobs/:id/start', upload.single('beforeImage'), startRepair);
router.post('/jobs/:id/repair', upload.single('afterImage'), completeRepair);

export default router;
