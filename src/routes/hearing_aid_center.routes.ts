import { Router, Request, Response } from 'express';
import HearingAidCenter from '../models/hearing_aid_center.model';
import CenterService from '../models/center_service.model';
import Gallery from '../models/gallery.model';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
const CENTER_TYPE = 'hearing_aid';

router.get('/', async (req: Request, res: Response) => {
  const { division, district, upazila } = req.query;
  const filter: any = {};
  if (division) filter.division = new RegExp(division as string, 'i');
  if (district) filter.district = new RegExp(district as string, 'i');
  if (upazila) filter.upazila = new RegExp(upazila as string, 'i');
  const centers = await HearingAidCenter.find(filter).sort({ createdAt: -1 });
  res.json(centers);
});

router.post('/', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const center = await HearingAidCenter.create(req.body);
    res.status(201).json(center);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  const center = await HearingAidCenter.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!center) return res.status(404).json({ message: 'Not found' });
  res.json(center);
});

router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  await HearingAidCenter.findByIdAndDelete(req.params.id);
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
