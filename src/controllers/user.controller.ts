import { Request, Response } from 'express';
import User from '../models/user.model';
import bcrypt from 'bcryptjs';

export const getMe = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const updateMe = async (req: Request, res: Response) => {
  const { name, email, phone, imageUrl, division, district, upazila } = req.body;
  const update: any = {};
  if (name) update.name = name;
  if (email) update.email = email;
  if (phone) update.phone = phone;
  if (imageUrl !== undefined) update.imageUrl = imageUrl;
  if (division) update.division = division;
  if (district) update.district = district;
  if (upazila) update.upazila = upazila;
  const user = await User.findByIdAndUpdate(
    (req as any).user.id,
    update,
    { new: true }
  ).select('-password');
  res.json(user);
};

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both fields required' });
  const user = await User.findById((req as any).user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const match = await user.comparePassword(currentPassword);
  if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
};

export const getAllUsers = async (req: Request, res: Response) => {
  const filter = req.query.role ? { role: req.query.role } : {};
  const users = await User.find(filter).select('-password');
  res.json(users);
};

export const getUserById = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const updateUser = async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const deleteUser = async (req: Request, res: Response) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
};

export const saveFcmToken = async (req: Request, res: Response) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ message: 'fcmToken is required' });
  await User.findByIdAndUpdate((req as any).user.id, { fcmToken });
  res.json({ message: 'FCM token saved' });
};
