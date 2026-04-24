import { Router } from 'express';
import { sendNotification, getNotifications, updateNotification, deleteNotification } from '../controllers/notification.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, authorize('admin'), getNotifications);
router.post('/', protect, authorize('admin'), sendNotification);
router.put('/:id', protect, authorize('admin'), updateNotification);
router.delete('/:id', protect, authorize('admin'), deleteNotification);

export default router;
