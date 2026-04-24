import { Router } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import {
  registerAmbulance,
  getAllAmbulances,
  bookAmbulance,
  updateAmbulance,
  updateAmbulanceStatus,
} from '../controllers/ambulance.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `doctor-list/ambulances/${file.fieldname}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    transformation: file.fieldname.includes('Image') ? [{ width: 800, crop: 'limit' }] : undefined,
  }),
});

const upload = multer({ storage }).fields([
  { name: 'driverImage', maxCount: 1 },
  { name: 'ambulanceImage', maxCount: 1 },
  { name: 'drivingLicence', maxCount: 1 },
  { name: 'nid', maxCount: 1 },
  { name: 'carDocument', maxCount: 1 },
]);

const router = Router();

router.get('/', getAllAmbulances);
router.post('/book', protect, bookAmbulance);
router.post('/', protect, authorize('admin'), upload, registerAmbulance);
router.put('/:id', protect, authorize('admin'), updateAmbulance);
router.patch('/:id/status', protect, authorize('admin'), updateAmbulanceStatus);

export default router;
