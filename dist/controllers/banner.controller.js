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
        const filter = { isActive: true };
        if (category)
            filter.category = category;
        // If location parameters are provided, use location-based filtering with priority
        // Otherwise, return only global banners (no location set)
        if (division || district || upazila) {
            // Priority-based location matching:
            // 1. Exact match (division + district + upazila)
            // 2. Division + District match (upazila empty/null)
            // 3. Division only match (district and upazila empty/null)
            // 4. Global banners (no location set)
            const locationConditions = [];
            // Exact match (division + district + upazila) - highest priority
            if (division && district && upazila) {
                locationConditions.push({
                    'location.division': String(division),
                    'location.district': String(district),
                    'location.upazila': String(upazila)
                });
            }
            // Division + District match (upazila not set or empty)
            if (division && district) {
                locationConditions.push({
                    'location.division': String(division),
                    'location.district': String(district),
                    $or: [
                        { 'location.upazila': { $exists: false } },
                        { 'location.upazila': null },
                        { 'location.upazila': '' }
                    ]
                });
            }
            // Division only match (district and upazila not set or empty)
            if (division) {
                locationConditions.push({
                    'location.division': String(division),
                    $or: [
                        { 'location.district': { $exists: false } },
                        { 'location.district': null },
                        { 'location.district': '' }
                    ]
                });
            }
            // Global banners (no location set) - lowest priority
            locationConditions.push({
                $or: [
                    { location: { $exists: false } },
                    { 'location.division': { $exists: false } },
                    { 'location.division': null },
                    { 'location.division': '' }
                ]
            });
            filter.$or = locationConditions;
        }
        else {
            // No location parameters provided - return only global banners
            filter.$or = [
                { location: { $exists: false } },
                { 'location.division': { $exists: false } },
                { 'location.division': null },
                { 'location.division': '' }
            ];
        }
        const banners = await banner_model_1.default.find(filter).sort({ order: 1 });
        res.json(banners);
    }
    catch {
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
