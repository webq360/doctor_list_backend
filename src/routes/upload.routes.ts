import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { uploadImage, deleteImage } from '../controllers/upload.controller';

const router = Router();

router.post('/', protect, uploadSingle('general'), uploadImage);
router.post('/general', protect, uploadSingle('general'), uploadImage);
router.post('/doctor', protect, uploadSingle('doctors'), uploadImage);
router.post('/hospital', protect, uploadSingle('hospitals'), uploadImage);
router.post('/banner', protect, uploadSingle('banners'), uploadImage);
router.delete('/', protect, deleteImage);

export default router;
