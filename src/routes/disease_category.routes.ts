import { Router, Request, Response } from 'express';
import DiseaseCategory from '../models/disease_category.model';
import Doctor from '../models/doctor.model';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public: get all categories
// Returns categories with virtual `assignedDoctorIds` field for admin compatibility
router.get('/', async (_req: Request, res: Response) => {
  const categories = await DiseaseCategory.find({ isActive: true }).sort({ name: 1 });
  // Attach assignedDoctorIds for admin dashboard compatibility
  const result = await Promise.all(
    categories.map(async (cat) => {
      const doctors = await Doctor.find({
        isApproved: true,
        specializations: { $elemMatch: { $in: cat.specializations.map((s) => new RegExp(s, 'i')) } },
      }).select('_id');
      return {
        ...cat.toObject(),
        assignedDoctorIds: doctors.map((d) => d._id.toString()),
      };
    })
  );
  res.json(result);
});

// Public: get doctors by disease category
router.get('/:id/doctors', async (req: Request, res: Response) => {
  const category = await DiseaseCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });

  const doctors = await Doctor.find({
    isApproved: true,
    specializations: { $elemMatch: { $in: category.specializations.map((s) => new RegExp(s, 'i')) } },
  })
    .populate('userId', 'name email phone')
    .populate('hospitalId', 'name address');

  res.json({ category, doctors });
});

// Admin: create
router.post('/', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    // Strip admin-only fields not in schema
    const { assignedDoctorIds, ...body } = req.body;
    const cat = await DiseaseCategory.create(body);
    res.status(201).json({ ...cat.toObject(), assignedDoctorIds: [] });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update (supports assignedDoctorIds by syncing specializations)
router.put('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { assignedDoctorIds, ...body } = req.body;

    // If admin sends assignedDoctorIds, sync specializations from those doctors
    if (Array.isArray(assignedDoctorIds)) {
      const doctors = await Doctor.find({ _id: { $in: assignedDoctorIds } }).select('specializations');
      const allSpecs = [...new Set(doctors.flatMap((d) => d.specializations))];
      body.specializations = allSpecs;
    }

    const cat = await DiseaseCategory.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!cat) return res.status(404).json({ message: 'Not found' });

    // Return with assignedDoctorIds for admin compatibility
    const assignedDoctors = await Doctor.find({
      isApproved: true,
      specializations: { $elemMatch: { $in: cat.specializations.map((s) => new RegExp(s, 'i')) } },
    }).select('_id');

    res.json({
      ...cat.toObject(),
      assignedDoctorIds: assignedDoctors.map((d) => d._id.toString()),
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: delete
router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  await DiseaseCategory.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;
