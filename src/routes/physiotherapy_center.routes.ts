import { Router } from 'express';
import {
  createCenter, getAllCenters, getCenterById, getNearestCenters, updateCenter, deleteCenter,
  getCenterDoctors, addDoctorToCenter, removeDoctorFromCenter,
  getCenterAmbulances, addAmbulanceToCenter, removeAmbulanceFromCenter,
  getCenterServices, addCenterService, removeCenterService,
} from '../controllers/physiotherapy_center.controller';
import Therapist from '../models/therapist.model';
import Gallery from '../models/gallery.model';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
const CENTER_TYPE = 'physiotherapy';

router.get('/', getAllCenters);
router.get('/nearest', getNearestCenters);
router.get('/:id', getCenterById);
router.post('/', protect, authorize('admin'), createCenter);
router.put('/:id', protect, authorize('admin'), updateCenter);
router.delete('/:id', protect, authorize('admin'), deleteCenter);

// Doctors
router.get('/:id/doctors', getCenterDoctors);
router.post('/:id/doctors', protect, authorize('admin'), addDoctorToCenter);
router.delete('/:id/doctors/:doctorId', protect, authorize('admin'), removeDoctorFromCenter);

// Ambulances
router.get('/:id/ambulances', getCenterAmbulances);
router.post('/:id/ambulances', protect, authorize('admin'), addAmbulanceToCenter);
router.delete('/:id/ambulances/:ambulanceId', protect, authorize('admin'), removeAmbulanceFromCenter);

// Services
router.get('/:id/services', getCenterServices);
router.post('/:id/services', protect, authorize('admin'), addCenterService);
router.delete('/:id/services/:serviceId', protect, authorize('admin'), removeCenterService);

// ── Therapists ──
router.get('/:id/therapists', async (req, res) => {
  const therapists = await Therapist.find({ centerId: req.params.id, centerType: CENTER_TYPE });
  res.json(therapists);
});

router.post('/:id/therapists', protect, authorize('admin'), async (req: any, res: any) => {
  try {
    const therapist = await Therapist.create({ ...req.body, centerId: req.params.id, centerType: CENTER_TYPE });
    res.status(201).json(therapist);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/therapists/:therapistId', protect, authorize('admin'), async (req: any, res: any) => {
  const therapist = await Therapist.findByIdAndUpdate(req.params.therapistId, req.body, { new: true });
  if (!therapist) return res.status(404).json({ message: 'Not found' });
  res.json(therapist);
});

router.delete('/:id/therapists/:therapistId', protect, authorize('admin'), async (req: any, res: any) => {
  await Therapist.findByIdAndDelete(req.params.therapistId);
  res.json({ message: 'Deleted' });
});

// ── Gallery ──
router.get('/:id/gallery', async (req, res) => {
  const images = await Gallery.find({ centerId: req.params.id, centerType: CENTER_TYPE });
  res.json(images);
});

router.post('/:id/gallery', protect, authorize('admin'), async (req: any, res: any) => {
  try {
    const image = await Gallery.create({ ...req.body, centerId: req.params.id, centerType: CENTER_TYPE });
    res.status(201).json(image);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/gallery/:imageId', protect, authorize('admin'), async (req: any, res: any) => {
  await Gallery.findByIdAndDelete(req.params.imageId);
  res.json({ message: 'Deleted' });
});

export default router;
