import { Router } from 'express';
import { sendNotification, getNotifications, updateNotification, deleteNotification } from '../controllers/notification.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Any logged-in user can view notifications
router.get('/', protect, getNotifications);

// Only admin can send/edit/delete
router.post('/', protect, authorize('admin'), sendNotification);
router.put('/:id', protect, authorize('admin'), updateNotification);
router.delete('/:id', protect, authorize('admin'), deleteNotification);

export default router;
