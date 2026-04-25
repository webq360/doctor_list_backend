import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/user.model';
import { generateToken } from '../utils/jwt.util';

const FIXED_OTP = '5805';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6),
  role: z.enum(['patient', 'doctor', 'ambulance_user']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const { name, email, phone, password, role } = parsed.data;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, phone, password, role: role || 'patient' });
  const token = generateToken(user.id, user.role);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive } });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user.id, user.role);
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
};

// Phone OTP login — auto-register if new user
export const phoneLogin = async (req: Request, res: Response) => {
  const { phone, otp, name } = req.body;
  console.log('[phoneLogin] phone:', phone, '| otp:', otp);
  if (!phone) return res.status(400).json({ message: 'Phone is required' });
  if (!otp) return res.status(400).json({ message: 'OTP is required' });
  if (otp !== FIXED_OTP) {
    console.log('[phoneLogin] OTP mismatch — received:', otp, '| expected:', FIXED_OTP);
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  let user = await User.findOne({ phone });
  let isNew = false;

  if (!user) {
    // Auto-register
    const displayName = name?.trim() || `User${phone.slice(-4)}`;
    user = await User.create({
      name: displayName,
      phone,
      email: undefined,
      password: FIXED_OTP + phone,
      role: 'patient',
    });
    isNew = true;
  }

  const token = generateToken(user.id, user.role);
  res.json({
    token,
    isNew,
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
  });
};

// Check if phone is already registered
export const checkPhone = async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone is required' });
  const exists = await User.findOne({ phone });
  res.json({ exists: !!exists, name: exists?.name });
};
