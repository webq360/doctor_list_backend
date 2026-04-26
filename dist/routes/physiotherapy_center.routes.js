"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const physiotherapy_center_controller_1 = require("../controllers/physiotherapy_center.controller");
const therapist_model_1 = __importDefault(require("../models/therapist.model"));
const gallery_model_1 = __importDefault(require("../models/gallery.model"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const CENTER_TYPE = 'physiotherapy';
router.get('/', physiotherapy_center_controller_1.getAllCenters);
router.get('/nearest', physiotherapy_center_controller_1.getNearestCenters);
router.get('/:id', physiotherapy_center_controller_1.getCenterById);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.createCenter);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.updateCenter);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.deleteCenter);
// Doctors
router.get('/:id/doctors', physiotherapy_center_controller_1.getCenterDoctors);
router.post('/:id/doctors', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.addDoctorToCenter);
router.delete('/:id/doctors/:doctorId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.removeDoctorFromCenter);
// Ambulances
router.get('/:id/ambulances', physiotherapy_center_controller_1.getCenterAmbulances);
router.post('/:id/ambulances', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.addAmbulanceToCenter);
router.delete('/:id/ambulances/:ambulanceId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.removeAmbulanceFromCenter);
// Services
router.get('/:id/services', physiotherapy_center_controller_1.getCenterServices);
router.post('/:id/services', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.addCenterService);
router.delete('/:id/services/:serviceId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.removeCenterService);
// ── Therapists ──
router.get('/:id/therapists', async (req, res) => {
    const therapists = await therapist_model_1.default.find({ centerId: req.params.id, centerType: CENTER_TYPE });
    res.json(therapists);
});
router.post('/:id/therapists', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const therapist = await therapist_model_1.default.create({ ...req.body, centerId: req.params.id, centerType: CENTER_TYPE });
        res.status(201).json(therapist);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.put('/:id/therapists/:therapistId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    const therapist = await therapist_model_1.default.findByIdAndUpdate(req.params.therapistId, req.body, { new: true });
    if (!therapist)
        return res.status(404).json({ message: 'Not found' });
    res.json(therapist);
});
router.delete('/:id/therapists/:therapistId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    await therapist_model_1.default.findByIdAndDelete(req.params.therapistId);
    res.json({ message: 'Deleted' });
});
// ── Gallery ──
router.get('/:id/gallery', async (req, res) => {
    const images = await gallery_model_1.default.find({ centerId: req.params.id, centerType: CENTER_TYPE });
    res.json(images);
});
router.post('/:id/gallery', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const image = await gallery_model_1.default.create({ ...req.body, centerId: req.params.id, centerType: CENTER_TYPE });
        res.status(201).json(image);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.delete('/:id/gallery/:imageId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    await gallery_model_1.default.findByIdAndDelete(req.params.imageId);
    res.json({ message: 'Deleted' });
});
exports.default = router;
