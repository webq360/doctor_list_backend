"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAmbulanceStatus = exports.updateAmbulance = exports.bookAmbulance = exports.getAllAmbulances = exports.registerAmbulance = void 0;
const ambulance_model_1 = __importDefault(require("../models/ambulance.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const registerAmbulance = async (req, res) => {
    try {
        const { ambulanceName, driverName, phone, email, vehicleNumber, ambulanceType, address, password, } = req.body;
        if (!ambulanceName || !phone) {
            return res.status(400).json({ message: 'Ambulance name and phone are required' });
        }
        // Create ambulance_user account only if password provided
        let userId;
        if (password) {
            const existingUser = email ? await user_model_1.default.findOne({ email }) : null;
            if (existingUser)
                return res.status(409).json({ message: 'Email already registered' });
            const user = await user_model_1.default.create({
                name: driverName || ambulanceName,
                email: email || `${phone}@ambulance.local`,
                phone,
                password,
                role: 'ambulance_user',
            });
            userId = user._id;
        }
        // Handle uploaded files
        const files = req.files;
        const getUrl = (key) => files?.[key]?.[0]?.path || undefined;
        const ambulance = await ambulance_model_1.default.create({
            ambulanceName, driverName, phone, email, vehicleNumber,
            ambulanceType, address,
            userId,
            driverImage: getUrl('driverImage'),
            ambulanceImage: getUrl('ambulanceImage'),
            documents: {
                drivingLicence: getUrl('drivingLicence'),
                nid: getUrl('nid'),
                carDocument: getUrl('carDocument'),
            },
        });
        res.status(201).json({ ambulance, ...(userId ? { user: { id: userId } } : {}) });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.registerAmbulance = registerAmbulance;
const getAllAmbulances = async (req, res) => {
    const ambulances = await ambulance_model_1.default.find().populate('hospitalId', 'name address').populate('userId', 'name email');
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
const updateAmbulance = async (req, res) => {
    const ambulance = await ambulance_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ambulance)
        return res.status(404).json({ message: 'Ambulance not found' });
    res.json(ambulance);
};
exports.updateAmbulance = updateAmbulance;
const updateAmbulanceStatus = async (req, res) => {
    const ambulance = await ambulance_model_1.default.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!ambulance)
        return res.status(404).json({ message: 'Ambulance not found' });
    res.json(ambulance);
};
exports.updateAmbulanceStatus = updateAmbulanceStatus;
