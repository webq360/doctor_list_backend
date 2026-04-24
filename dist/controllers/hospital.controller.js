"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHospital = exports.updateHospital = exports.getNearestHospitals = exports.getHospitalById = exports.getAllHospitals = exports.createHospital = void 0;
const zod_1 = require("zod");
const hospital_model_1 = __importDefault(require("../models/hospital.model"));
const distance_util_1 = require("../utils/distance.util");
const hospitalSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    address: zod_1.z.string().min(5),
    location: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }),
    contact: zod_1.z.string().min(10),
});
const createHospital = async (req, res) => {
    const parsed = hospitalSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ errors: parsed.error.flatten() });
    const hospital = await hospital_model_1.default.create(parsed.data);
    res.status(201).json(hospital);
};
exports.createHospital = createHospital;
const getAllHospitals = async (req, res) => {
    const hospitals = await hospital_model_1.default.find().populate('doctors');
    res.json(hospitals);
};
exports.getAllHospitals = getAllHospitals;
const getHospitalById = async (req, res) => {
    const hospital = await hospital_model_1.default.findById(req.params.id).populate({
        path: 'doctors',
        populate: { path: 'userId', select: 'name' },
    });
    if (!hospital)
        return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
};
exports.getHospitalById = getHospitalById;
const getNearestHospitals = async (req, res) => {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng)
        return res.status(400).json({ message: 'lat and lng are required' });
    const hospitals = await hospital_model_1.default.find();
    const nearby = hospitals
        .map((h) => ({
        ...h.toObject(),
        distance: (0, distance_util_1.getDistance)(Number(lat), Number(lng), h.location.lat, h.location.lng),
    }))
        .filter((h) => h.distance <= Number(radius))
        .sort((a, b) => a.distance - b.distance);
    res.json(nearby);
};
exports.getNearestHospitals = getNearestHospitals;
const updateHospital = async (req, res) => {
    const hospital = await hospital_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hospital)
        return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
};
exports.updateHospital = updateHospital;
const deleteHospital = async (req, res) => {
    await hospital_model_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hospital deleted' });
};
exports.deleteHospital = deleteHospital;
