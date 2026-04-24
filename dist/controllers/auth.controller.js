"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const zod_1 = require("zod");
const user_model_1 = __importDefault(require("../models/user.model"));
const jwt_util_1 = require("../utils/jwt.util");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['patient', 'doctor']).optional(),
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
    res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role } });
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
