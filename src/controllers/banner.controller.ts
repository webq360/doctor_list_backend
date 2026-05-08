import { Response, Request } from 'express';
import Banner from '../models/banner.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getBanners = async (req: Request, res: Response) => {
  try {
    const { category, division, district, upazila } = req.query;
    
    console.log('📍 Banner API Request:', { category, division, district, upazila });
    
    // Build base filter
    const baseFilter: any = { isActive: true };
    if (category) baseFilter.category = category;

    // If no location parameters provided, return only global banners
    if (!division && !district && !upazila) {
      const filter = {
        ...baseFilter,
        $or: [
          { location: { $exists: false } },
          { 'location.division': { $exists: false } },
          { 'location.division': null },
          { 'location.division': '' }
        ]
      };
      const banners = await Banner.find(filter).sort({ order: 1 });
      console.log(`📍 Banner API: No location params - returning ${banners.length} global banners`);
      return res.json(banners);
    }

    console.log(`📍 Banner API: User location - Division: ${division}, District: ${district}, Upazila: ${upazila}`);

    // Priority-based matching - try from most specific to least specific
    // Return ONLY the first match found (no mixing)

    // Priority 1: Exact match (division + district + upazila)
    if (division && district && upazila) {
      const exactMatch = await Banner.find({
        ...baseFilter,
        'location.division': { $regex: division as string, $options: 'i' },
        'location.district': { $regex: district as string, $options: 'i' },
        'location.upazila': { $regex: upazila as string, $options: 'i' }
      }).sort({ order: 1 });
      
      console.log(`🔍 Priority 1 Query:`, {
        'location.division': { $regex: division as string, $options: 'i' },
        'location.district': { $regex: district as string, $options: 'i' },
        'location.upazila': { $regex: upazila as string, $options: 'i' }
      });
      console.log(`📊 Priority 1 Results: ${exactMatch.length} banners found`);
      
      if (exactMatch.length > 0) {
        console.log(`✅ Priority 1: Found ${exactMatch.length} exact match banners (Division + District + Upazila)`);
        console.log(`📄 Banners:`, exactMatch.map(b => ({ id: b._id, location: b.location })));
        return res.json(exactMatch);
      }
      console.log('⏭️ Priority 1: No exact match, trying next...');
    }
    
    // Priority 2: Division + District (upazila not specified in banner)
    if (division && district) {
      const districtMatch = await Banner.find({
        ...baseFilter,
        'location.division': { $regex: division as string, $options: 'i' },
        'location.district': { $regex: district as string, $options: 'i' },
        $or: [
          { 'location.upazila': { $exists: false } },
          { 'location.upazila': null },
          { 'location.upazila': '' }
        ]
      }).sort({ order: 1 });
      
      console.log(`📊 Priority 2 Results: ${districtMatch.length} banners found`);
      
      if (districtMatch.length > 0) {
        console.log(`✅ Priority 2: Found ${districtMatch.length} district match banners (Division + District)`);
        console.log(`📄 Banners:`, districtMatch.map(b => ({ id: b._id, location: b.location })));
        return res.json(districtMatch);
      }
      console.log('⏭️ Priority 2: No district match, trying next...');
    }
    
    // Priority 3: Division only (district not specified in banner)
    if (division) {
      const divisionMatch = await Banner.find({
        ...baseFilter,
        'location.division': { $regex: division as string, $options: 'i' },
        $or: [
          { 'location.district': { $exists: false } },
          { 'location.district': null },
          { 'location.district': '' }
        ]
      }).sort({ order: 1 });
      
      console.log(`📊 Priority 3 Results: ${divisionMatch.length} banners found`);
      
      if (divisionMatch.length > 0) {
        console.log(`✅ Priority 3: Found ${divisionMatch.length} division match banners (Division only)`);
        console.log(`📄 Banners:`, divisionMatch.map(b => ({ id: b._id, location: b.location })));
        return res.json(divisionMatch);
      }
      console.log('⏭️ Priority 3: No division match, trying global...');
    }
    
    // Priority 4: Global banners (fallback)
    const globalBanners = await Banner.find({
      ...baseFilter,
      $or: [
        { location: { $exists: false } },
        { 'location.division': { $exists: false } },
        { 'location.division': null },
        { 'location.division': '' }
      ]
    }).sort({ order: 1 });
    
    console.log(`✅ Priority 4: Returning ${globalBanners.length} global banners (fallback)`);
    res.json(globalBanners);
    
  } catch (err) {
    console.error('❌ Banner fetch error:', err);
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
    const { imageUrl, title, order, category, division, district, upazila, location } = req.body;
    if (!imageUrl) return res.status(400).json({ message: 'imageUrl is required' });
    if (!category) return res.status(400).json({ message: 'Category is required' });
    
    // Support both formats:
    // 1. Nested: { location: { division, district, upazila } }
    // 2. Flat: { division, district, upazila }
    let bannerLocation = undefined;
    if (location && location.division) {
      // Nested format (new)
      bannerLocation = location;
    } else if (division) {
      // Flat format (legacy)
      bannerLocation = { division, district, upazila };
    }
    
    console.log('📍 Banner creation request:', {
      imageUrl: imageUrl?.substring(0, 50),
      title,
      category,
      location: bannerLocation,
    });
    
    const banner = await Banner.create({
      imageUrl, 
      title, 
      order: order || 0, 
      category,
      location: bannerLocation,
      isActive: true,  // Ensure banner is active by default
    });
    
    console.log('✅ Banner created:', {
      id: banner._id,
      category: banner.category,
      location: banner.location,
      isActive: banner.isActive,
    });
    
    res.status(201).json(banner);
  } catch (err: any) {
    console.error('❌ Banner creation error:', err);
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
