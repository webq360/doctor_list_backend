"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAmbulanceStatus = exports.bookAmbulance = exports.getAllAmbulances = exports.registerAmbulance = void 0;
const zod_1 = require("zod");
const ambulance_model_1 = __importDefault(require("../models/ambulance.model"));
const ambulanceSchema = zod_1.z.object({
    driverName: zod_1.z.string().min(2),
    phone: zod_1.z.string().min(10),
    vehicleNumber: zod_1.z.string().min(4),
    hospitalId: zod_1.z.string().optional(),
});
const registerAmbulance = async (req, res) => {
    const parsed = ambulanceSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ errors: parsed.error.flatten() });
    const ambulance = await ambulance_model_1.default.create(parsed.data);
    res.status(201).json(ambulance);
};
exports.registerAmbulance = registerAmbulance;
const getAllAmbulances = async (req, res) => {
    const ambulances = await ambulance_model_1.default.find().populate('hospitalId', 'name address');
    res.json(ambulances);
};
exports.getAllAmbulances = getAllAmbulances;
const bookAmbulance = async (req, res) => {
    const ambulance = await ambulance_model_1.default.findOneAndUpdate({ status: 'available' }, { status: 'busy' }, { new: true });
    if (!ambulance)
        return res.status(404).json({ message: 'No ambulance available' });
    res.json({ message: 'Ambulance booked', ambulance });
};
exports.bookAmbulance = bookAmbulance;
const updateAmbulanceStatus = async (req, res) => {
    const ambulance = await ambulance_model_1.default.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!ambulance)
        return res.status(404).json({ message: 'Ambulance not found' });
    res.json(ambulance);
};
exports.updateAmbulanceStatus = updateAmbulanceStatus;
