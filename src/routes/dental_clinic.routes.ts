import { Router, Request, Response } from 'express';
import DentalClinic from '../models/dental_clinic.model';
import CenterService from '../models/center_service.model';
import Dentist from '../models/dentist.model';
import Gallery from '../models/gallery.model';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
const CENTER_TYPE = 'dental';

router.get('/', async (req: Request, res: Response) => {
  const { division, district, upazila } = req.query;
  const filter: any = {};
  if (division) filter.division = new RegExp(division as string, 'i');
  if (district) filter.district = new RegExp(district as string, 'i');
  if (upazila) filter.upazila = new RegExp(upazila as string, 'i');
  const clinics = await DentalClinic.find(filter).sort({ createdAt: -1 });
  res.json(clinics);
});

router.post('/', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const clinic = await DentalClinic.create(req.body);
    res.status(201).json(clinic);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  const clinic = await DentalClinic.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!clinic) return res.status(404).json({ message: 'Not found' });
  res.json(clinic);
});

router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  await DentalClinic.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// Services
router.get('/:id/services', async (req: Request, res: Response) => {
  const services = await CenterService.find({ centerId: req.params.id, centerType: CENTER_TYPE });
  res.json(services);
});

router.post('/:id/services', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const service = await CenterService.create({ ...req.body, centerId: req.params.id, centerType: CENTER_TYPE });
    res.status(201).json(service);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/services/:serviceId', protect, authorize('admin'), async (req: Request, res: Response) => {
  const service = await CenterService.findByIdAndUpdate(req.params.serviceId, req.body, { new: true });
  if (!service) return res.status(404).json({ message: 'Not found' });
  res.json(service);
});

router.delete('/:id/services/:serviceId', protect, authorize('admin'), async (req: Request, res: Response) => {
  await CenterService.findByIdAndDelete(req.params.serviceId);
  res.json({ message: 'Deleted' });
});

// ── Dentists ──
router.get('/:id/dentists', async (req: Request, res: Response) => {
  const dentists = await Dentist.find({ centerId: req.params.id });
  res.json(dentists);
});

router.post('/:id/dentists', protect, authorize('admin'), async (req: any, res: any) => {
  try {
    const dentist = await Dentist.create({ ...req.body, centerId: req.params.id });
    res.status(201).json(dentist);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/dentists/:dentistId', protect, authorize('admin'), async (req: any, res: any) => {
  const dentist = await Dentist.findByIdAndUpdate(req.params.dentistId, req.body, { new: true });
  if (!dentist) return res.status(404).json({ message: 'Not found' });
  res.json(dentist);
});

router.delete('/:id/dentists/:dentistId', protect, authorize('admin'), async (req: any, res: any) => {
  await Dentist.findByIdAndDelete(req.params.dentistId);
  res.json({ message: 'Deleted' });
});

// ── Gallery ──
router.get('/:id/gallery', async (req: Request, res: Response) => {
  const images = await Gallery.find({ centerId: req.params.id, centerType: CENTER_TYPE });
  res.json(images);
});

router.post('/:id/gallery', protect, authorize('admin'), async (req: any, res: any) => {
  try {
    const image = await Gallery.create({ ...req.body, centerId: req.params.id, centerType: CENTER_TYPE });
    res.status(201).json(image);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/gallery/:imageId', protect, authorize('admin'), async (req: any, res: any) => {
  const image = await Gallery.findByIdAndUpdate(req.params.imageId, req.body, { new: true });
  if (!image) return res.status(404).json({ message: 'Not found' });
  res.json(image);
});

router.delete('/:id/gallery/:imageId', protect, authorize('admin'), async (req: any, res: any) => {
  await Gallery.findByIdAndDelete(req.params.imageId);
  res.json({ message: 'Deleted' });
});

export default router;
