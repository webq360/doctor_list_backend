"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCenterService = exports.addCenterService = exports.getCenterServices = exports.removeAmbulanceFromCenter = exports.addAmbulanceToCenter = exports.getCenterAmbulances = exports.removeDoctorFromCenter = exports.addDoctorToCenter = exports.getCenterDoctors = exports.deleteCenter = exports.updateCenter = exports.getNearestCenters = exports.getCenterById = exports.getAllCenters = exports.createCenter = void 0;
const physiotherapy_center_model_1 = __importDefault(require("../models/physiotherapy_center.model"));
const physiotherapy_service_model_1 = __importDefault(require("../models/physiotherapy_service.model"));
const doctor_model_1 = __importDefault(require("../models/doctor.model"));
const ambulance_model_1 = __importDefault(require("../models/ambulance.model"));
const distance_util_1 = require("../utils/distance.util");
const createCenter = async (req, res) => {
    try {
        const { name, address, division, district, upazila, contact, logo, coverImage, location } = req.body;
        if (!name || !address || !contact)
            return res.status(400).json({ message: 'name, address and contact are required' });
        const center = await physiotherapy_center_model_1.default.create({
            name, address, contact,
            division: division || undefined,
            district: district || undefined,
            upazila: upazila || undefined,
            logo: logo || undefined,
            coverImage: coverImage || undefined,
            location: location?.lat && location?.lng ? { lat: Number(location.lat), lng: Number(location.lng) } : undefined,
        });
        res.status(201).json(center);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createCenter = createCenter;
const getAllCenters = async (req, res) => {
    const centers = await physiotherapy_center_model_1.default.find();
    res.json(centers);
};
exports.getAllCenters = getAllCenters;
const getCenterById = async (req, res) => {
    const center = await physiotherapy_center_model_1.default.findById(req.params.id);
    if (!center)
        return res.status(404).json({ message: 'Center not found' });
    res.json(center);
};
exports.getCenterById = getCenterById;
const getNearestCenters = async (req, res) => {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng)
        return res.status(400).json({ message: 'lat and lng are required' });
    const centers = await physiotherapy_center_model_1.default.find({ 'location.lat': { $exists: true } });
    const nearby = centers
        .filter((c) => c.location?.lat != null && c.location?.lng != null)
        .map((c) => ({
        ...c.toObject(),
        distance: (0, distance_util_1.getDistance)(Number(lat), Number(lng), c.location.lat, c.location.lng),
    }))
        .filter((c) => c.distance <= Number(radius))
        .sort((a, b) => a.distance - b.distance);
    res.json(nearby);
};
exports.getNearestCenters = getNearestCenters;
const updateCenter = async (req, res) => {
    const center = await physiotherapy_center_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!center)
        return res.status(404).json({ message: 'Center not found' });
    res.json(center);
};
exports.updateCenter = updateCenter;
const deleteCenter = async (req, res) => {
    await physiotherapy_center_model_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Center deleted' });
};
exports.deleteCenter = deleteCenter;
// --- Doctors ---
const getCenterDoctors = async (req, res) => {
    const doctors = await doctor_model_1.default.find({ physiotherapyCenterId: req.params.id }).populate('userId', 'name email phone');
    res.json(doctors);
};
exports.getCenterDoctors = getCenterDoctors;
const addDoctorToCenter = async (req, res) => {
    const { doctorId } = req.body;
    if (!doctorId)
        return res.status(400).json({ message: 'doctorId required' });
    const doctor = await doctor_model_1.default.findByIdAndUpdate(doctorId, { physiotherapyCenterId: req.params.id }, { new: true }).populate('userId', 'name email phone');
    if (!doctor)
        return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
};
exports.addDoctorToCenter = addDoctorToCenter;
const removeDoctorFromCenter = async (req, res) => {
    await doctor_model_1.default.findByIdAndUpdate(req.params.doctorId, { $unset: { physiotherapyCenterId: 1 } });
    res.json({ message: 'Doctor removed' });
};
exports.removeDoctorFromCenter = removeDoctorFromCenter;
// --- Ambulances ---
const getCenterAmbulances = async (req, res) => {
    const ambulances = await ambulance_model_1.default.find({ physiotherapyCenterId: req.params.id });
    res.json(ambulances);
};
exports.getCenterAmbulances = getCenterAmbulances;
const addAmbulanceToCenter = async (req, res) => {
    const { ambulanceId } = req.body;
    if (!ambulanceId)
        return res.status(400).json({ message: 'ambulanceId required' });
    const ambulance = await ambulance_model_1.default.findByIdAndUpdate(ambulanceId, { physiotherapyCenterId: req.params.id }, { new: true });
    if (!ambulance)
        return res.status(404).json({ message: 'Ambulance not found' });
    res.json(ambulance);
};
exports.addAmbulanceToCenter = addAmbulanceToCenter;
const removeAmbulanceFromCenter = async (req, res) => {
    await ambulance_model_1.default.findByIdAndUpdate(req.params.ambulanceId, { $unset: { physiotherapyCenterId: 1 } });
    res.json({ message: 'Ambulance removed' });
};
exports.removeAmbulanceFromCenter = removeAmbulanceFromCenter;
// --- Services ---
const getCenterServices = async (req, res) => {
    const services = await physiotherapy_service_model_1.default.find({ centerId: req.params.id })
        .populate({ path: 'availableDoctors', populate: { path: 'userId', select: 'name' } });
    res.json(services);
};
exports.getCenterServices = getCenterServices;
const addCenterService = async (req, res) => {
    const { name, shortTitle, about, whatWeOffer, availableDoctors, iconUrl } = req.body;
    if (!name)
        return res.status(400).json({ message: 'name required' });
    const service = await physiotherapy_service_model_1.default.create({
        centerId: req.params.id,
        name,
        shortTitle,
        about,
        whatWeOffer: Array.isArray(whatWeOffer) ? whatWeOffer.filter(Boolean) : [],
        availableDoctors: Array.isArray(availableDoctors) ? availableDoctors : [],
        iconUrl,
    });
    const populated = await service.populate({ path: 'availableDoctors', populate: { path: 'userId', select: 'name' } });
    res.status(201).json(populated);
};
exports.addCenterService = addCenterService;
const removeCenterService = async (req, res) => {
    await physiotherapy_service_model_1.default.findByIdAndDelete(req.params.serviceId);
    res.json({ message: 'Service removed' });
};
exports.removeCenterService = removeCenterService;
