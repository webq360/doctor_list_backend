import { Response, Request } from 'express';
import Banner from '../models/banner.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getBanners = async (req: Request, res: Response) => {
  try {
    const { category, division, district, upazila } = req.query;
    
    // Build base filter
    const filter: any = { isActive: true };
    if (category) filter.category = category;

    // If no location parameters provided, return only global banners
    if (!division && !district && !upazila) {
      filter.$or = [
        { location: { $exists: false } },
        { 'location.division': { $exists: false } },
        { 'location.division': null },
        { 'location.division': '' }
      ];
      const banners = await Banner.find(filter).sort({ order: 1 });
      return res.json(banners);
    }

    // Location parameters provided - use priority-based matching
    const locationConditions: any[] = [];
    
    // Priority 1: Exact match (division + district + upazila)
    if (division && district && upazila) {
      locationConditions.push({
        'location.division': division,
        'location.district': district,
        'location.upazila': upazila
      });
    }
    
    // Priority 2: Division + District (upazila not set)
    if (division && district) {
      locationConditions.push({
        'location.division': division,
        'location.district': district,
        $or: [
          { 'location.upazila': { $exists: false } },
          { 'location.upazila': null },
          { 'location.upazila': '' }
        ]
      });
    }
    
    // Priority 3: Division only (district not set)
    if (division) {
      locationConditions.push({
        'location.division': division,
        $or: [
          { 'location.district': { $exists: false } },
          { 'location.district': null },
          { 'location.district': '' }
        ]
      });
    }
    
    // Priority 4: Global banners (no location set)
    locationConditions.push({
      $or: [
        { location: { $exists: false } },
        { 'location.division': { $exists: false } },
        { 'location.division': null },
        { 'location.division': '' }
      ]
    });
    
    filter.$or = locationConditions;
    const banners = await Banner.find(filter).sort({ order: 1 });
    res.json(banners);
  } catch (err) {
    console.error('Banner fetch error:', err);
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
