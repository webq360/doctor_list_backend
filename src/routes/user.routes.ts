import { Router } from 'express';
import { getMe, updateMe, changePassword, getAllUsers, getUserById, updateUser, deleteUser, saveFcmToken } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Protected routes for authenticated users (no admin role required)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.patch('/me', protect, updateMe);
router.put('/me/password', protect, changePassword);
router.post('/fcm-token', protect, saveFcmToken);

// Admin-only routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;
