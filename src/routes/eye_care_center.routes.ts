import { Router, Request, Response } from 'express';
import EyeCareCenter from '../models/eye_care_center.model';
import CenterService from '../models/center_service.model';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
const CENTER_TYPE = 'eye_care';

// Public: get all (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  const { division, district, upazila } = req.query;
  const filter: any = {};
  if (division) filter.division = new RegExp(division as string, 'i');
  if (district) filter.district = new RegExp(district as string, 'i');
  if (upazila) filter.upazila = new RegExp(upazila as string, 'i');
  const centers = await EyeCareCenter.find(filter).sort({ createdAt: -1 });
  res.json(centers);
});

// Admin: create
router.post('/', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const center = await EyeCareCenter.create(req.body);
    res.status(201).json(center);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update
router.put('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  const center = await EyeCareCenter.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!center) return res.status(404).json({ message: 'Not found' });
  res.json(center);
});

// Admin: delete
router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  await EyeCareCenter.findByIdAndDelete(req.params.id);
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

export default router;
