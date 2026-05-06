"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBanner = exports.deleteBanner = exports.createBanner = exports.getAllBannersAdmin = exports.getBanners = void 0;
const banner_model_1 = __importDefault(require("../models/banner.model"));
const getBanners = async (req, res) => {
    try {
        const { category, division, district, upazila } = req.query;
        // Build base filter
        const baseFilter = { isActive: true };
        if (category)
            baseFilter.category = category;
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
            const banners = await banner_model_1.default.find(filter).sort({ order: 1 });
            console.log(`📍 Banner API: No location params - returning ${banners.length} global banners`);
            return res.json(banners);
        }
        console.log(`📍 Banner API: User location - Division: ${division}, District: ${district}, Upazila: ${upazila}`);
        // Priority-based matching - try from most specific to least specific
        // Return ONLY the first match found (no mixing)
        // Priority 1: Exact match (division + district + upazila)
        if (division && district && upazila) {
            const exactMatch = await banner_model_1.default.find({
                ...baseFilter,
                'location.division': division,
                'location.district': district,
                'location.upazila': upazila
            }).sort({ order: 1 });
            if (exactMatch.length > 0) {
                console.log(`✅ Priority 1: Found ${exactMatch.length} exact match banners (Division + District + Upazila)`);
                return res.json(exactMatch);
            }
            console.log('⏭️ Priority 1: No exact match, trying next...');
        }
        // Priority 2: Division + District (upazila not specified in banner)
        if (division && district) {
            const districtMatch = await banner_model_1.default.find({
                ...baseFilter,
                'location.division': division,
                'location.district': district,
                $or: [
                    { 'location.upazila': { $exists: false } },
                    { 'location.upazila': null },
                    { 'location.upazila': '' }
                ]
            }).sort({ order: 1 });
            if (districtMatch.length > 0) {
                console.log(`✅ Priority 2: Found ${districtMatch.length} district match banners (Division + District)`);
                return res.json(districtMatch);
            }
            console.log('⏭️ Priority 2: No district match, trying next...');
        }
        // Priority 3: Division only (district not specified in banner)
        if (division) {
            const divisionMatch = await banner_model_1.default.find({
                ...baseFilter,
                'location.division': division,
                $or: [
                    { 'location.district': { $exists: false } },
                    { 'location.district': null },
                    { 'location.district': '' }
                ]
            }).sort({ order: 1 });
            if (divisionMatch.length > 0) {
                console.log(`✅ Priority 3: Found ${divisionMatch.length} division match banners (Division only)`);
                return res.json(divisionMatch);
            }
            console.log('⏭️ Priority 3: No division match, trying global...');
        }
        // Priority 4: Global banners (fallback)
        const globalBanners = await banner_model_1.default.find({
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
    }
    catch (err) {
        console.error('❌ Banner fetch error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getBanners = getBanners;
const getAllBannersAdmin = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = {};
        if (category)
            filter.category = category;
        const banners = await banner_model_1.default.find(filter).sort({ category: 1, order: 1 });
        res.json(banners);
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllBannersAdmin = getAllBannersAdmin;
const createBanner = async (req, res) => {
    try {
        const { imageUrl, title, order, category, division, district, upazila } = req.body;
        if (!imageUrl)
            return res.status(400).json({ message: 'imageUrl is required' });
        if (!category)
            return res.status(400).json({ message: 'Category is required' });
        const banner = await banner_model_1.default.create({
            imageUrl, title, order: order || 0, category,
            location: (division) ? { division, district, upazila } : undefined,
        });
        res.status(201).json(banner);
    }
    catch (err) {
        res.status(500).json({ message: err?.message || 'Server error' });
    }
};
exports.createBanner = createBanner;
const deleteBanner = async (req, res) => {
    try {
        await banner_model_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Banner deleted' });
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteBanner = deleteBanner;
const updateBanner = async (req, res) => {
    try {
        const banner = await banner_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(banner);
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateBanner = updateBanner;
