import { Router } from 'express';
import { getBanners, getAllBannersAdmin, createBanner, deleteBanner, updateBanner } from '../controllers/banner.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getBanners);
router.get('/admin', protect, authorize('admin'), getAllBannersAdmin);
router.post('/', protect, authorize('admin'), createBanner);
router.patch('/:id', protect, authorize('admin'), updateBanner);
router.delete('/:id', protect, authorize('admin'), deleteBanner);

export default router;
