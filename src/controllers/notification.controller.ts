import { Request, Response } from 'express';
import Notification from '../models/notification.model';

export const sendNotification = async (req: Request, res: Response) => {
  const { title, body, targetRole = 'all', imageUrl } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'title and body are required' });

  const notification = await Notification.create({
    title,
    body,
    targetRole,
    imageUrl: imageUrl || undefined,
    sentBy: (req as any).user.id,
  });

  res.status(201).json(notification);
};

export const getNotifications = async (req: Request, res: Response) => {
  const notifications = await Notification.find()
    .populate('sentBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(notifications);
};

export const updateNotification = async (req: Request, res: Response) => {
  const { title, body, targetRole, imageUrl } = req.body;
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { title, body, targetRole, imageUrl: imageUrl || undefined },
    { new: true }
  ).populate('sentBy', 'name email');
  if (!notification) return res.status(404).json({ message: 'Not found' });
  res.json(notification);
};

export const deleteNotification = async (req: Request, res: Response) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};
