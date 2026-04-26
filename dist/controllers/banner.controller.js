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
        if (upazila || district || division) {
            // Return banners that match location OR have no location set (global banners)
            const locationConditions = [
                { location: { $exists: false } },
                { 'location.division': { $exists: false } },
                { 'location.division': null },
            ];
            if (division)
                locationConditions.push({ 'location.division': division, 'location.district': { $in: [null, undefined, ''] }, 'location.upazila': { $in: [null, undefined, ''] } });
            if (district)
                locationConditions.push({ 'location.division': division, 'location.district': district, 'location.upazila': { $in: [null, undefined, ''] } });
            if (upazila)
                locationConditions.push({ 'location.division': division, 'location.district': district, 'location.upazila': upazila });
            filter.$or = locationConditions;
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
