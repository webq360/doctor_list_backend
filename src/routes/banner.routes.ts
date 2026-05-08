import { Router } from 'express';
import { getBanners, getAllBannersAdmin, createBanner, deleteBanner, updateBanner } from '../controllers/banner.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Specific routes BEFORE generic routes
router.get('/admin', protect, authorize('admin'), getAllBannersAdmin);
router.post('/', protect, authorize('admin'), createBanner);
router.patch('/:id', protect, authorize('admin'), updateBanner);
router.delete('/:id', protect, authorize('admin'), deleteBanner);

// Generic routes AFTER specific routes
router.get('/', getBanners);

export default router;
