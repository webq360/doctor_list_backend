"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPhone = exports.phoneLogin = exports.login = exports.register = void 0;
const zod_1 = require("zod");
const user_model_1 = __importDefault(require("../models/user.model"));
const jwt_util_1 = require("../utils/jwt.util");
const FIXED_OTP = '5805';
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(6),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['patient', 'doctor', 'ambulance_user']).optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const register = async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ errors: parsed.error.flatten() });
    const { name, email, phone, password, role } = parsed.data;
    const exists = await user_model_1.default.findOne({ email });
    if (exists)
        return res.status(409).json({ message: 'Email already registered' });
    const user = await user_model_1.default.create({ name, email, phone, password, role: role || 'patient' });
    const token = (0, jwt_util_1.generateToken)(user.id, user.role);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive } });
};
exports.register = register;
const login = async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ errors: parsed.error.flatten() });
    const { email, password } = parsed.data;
    const user = await user_model_1.default.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = (0, jwt_util_1.generateToken)(user.id, user.role);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
};
exports.login = login;
// Phone OTP login — auto-register if new user
const phoneLogin = async (req, res) => {
    const { phone, otp, name } = req.body;
    if (!phone)
        return res.status(400).json({ message: 'Phone is required' });
    if (!otp)
        return res.status(400).json({ message: 'OTP is required' });
    if (otp !== FIXED_OTP)
        return res.status(401).json({ message: 'Invalid OTP' });
    let user = await user_model_1.default.findOne({ phone });
    let isNew = false;
    if (!user) {
        // Auto-register
        const displayName = name?.trim() || `User${phone.slice(-4)}`;
        user = await user_model_1.default.create({
            name: displayName,
            phone,
            password: FIXED_OTP + phone, // internal password, not used
            role: 'patient',
        });
        isNew = true;
    }
    const token = (0, jwt_util_1.generateToken)(user.id, user.role);
    res.json({
        token,
        isNew,
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });
};
exports.phoneLogin = phoneLogin;
// Check if phone is already registered
const checkPhone = async (req, res) => {
    const { phone } = req.body;
    if (!phone)
        return res.status(400).json({ message: 'Phone is required' });
    const exists = await user_model_1.default.findOne({ phone });
    res.json({ exists: !!exists, name: exists?.name });
};
exports.checkPhone = checkPhone;
