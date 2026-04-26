import { Router } from 'express';
import { getMe, updateMe, changePassword, getAllUsers, getUserById, updateUser, deleteUser, saveFcmToken } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/password', protect, changePassword);
router.post('/fcm-token', protect, saveFcmToken);

router.use(protect, authorize('admin'));
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
