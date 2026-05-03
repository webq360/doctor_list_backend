import { Response, Request } from 'express';
import Banner from '../models/banner.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getBanners = async (req: Request, res: Response) => {
  try {
    const { category, division, district, upazila } = req.query;
    const filter: any = { isActive: true };
    if (category) filter.category = category;

    // If location parameters are provided, use location-based filtering
    // Otherwise, return only global banners (no location set)
    if (division || district || upazila) {
      // Priority-based location matching:
      // 1. Exact match (division + district + upazila)
      // 2. Division + District match
      // 3. Division only match
      // 4. Global banners (no location set)
      
      const locationConditions: any[] = [];
      
      // Exact match (division + district + upazila) - highest priority
      if (division && district && upazila) {
        locationConditions.push({ 
          'location.division': division, 
          'location.district': district, 
          'location.upazila': upazila 
        });
      }
      
      // Division + District match
      if (division && district) {
        locationConditions.push({ 
          'location.division': division, 
          'location.district': district, 
          'location.upazila': { $in: [null, undefined, ''] } 
        });
      }
      
      // Division only match
      if (division) {
        locationConditions.push({ 
          'location.division': division, 
          'location.district': { $in: [null, undefined, ''] }, 
          'location.upazila': { $in: [null, undefined, ''] } 
        });
      }
      
      // Global banners (no location set) - lowest priority
      locationConditions.push({ location: { $exists: false } });
      locationConditions.push({ 'location.division': { $exists: false } });
      locationConditions.push({ 'location.division': null });
      
      filter.$or = locationConditions;
    } else {
      // No location parameters provided - return only global banners
      filter.$or = [
        { location: { $exists: false } },
        { 'location.division': { $exists: false } },
        { 'location.division': null }
      ];
    }

    const banners = await Banner.find(filter).sort({ order: 1 });
    res.json(banners);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllBannersAdmin = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    const banners = await Banner.find(filter).sort({ category: 1, order: 1 });
    res.json(banners);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl, title, order, category, division, district, upazila } = req.body;
    if (!imageUrl) return res.status(400).json({ message: 'imageUrl is required' });
    if (!category) return res.status(400).json({ message: 'Category is required' });
    const banner = await Banner.create({
      imageUrl, title, order: order || 0, category,
      location: (division) ? { division, district, upazila } : undefined,
    });
    res.status(201).json(banner);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Server error' });
  }
};

export const deleteBanner = async (req: AuthRequest, res: Response) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(banner);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
