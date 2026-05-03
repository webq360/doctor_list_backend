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
        const filter = { isActive: true };
        if (category)
            filter.category = category;
        // If no location parameters provided, return only global banners
        if (!division && !district && !upazila) {
            filter.$or = [
                { location: { $exists: false } },
                { 'location.division': { $exists: false } },
                { 'location.division': null },
                { 'location.division': '' }
            ];
            const banners = await banner_model_1.default.find(filter).sort({ order: 1 });
            return res.json(banners);
        }
        // Location parameters provided - use priority-based matching
        const locationConditions = [];
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
        const banners = await banner_model_1.default.find(filter).sort({ order: 1 });
        res.json(banners);
    }
    catch (err) {
        console.error('Banner fetch error:', err);
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
