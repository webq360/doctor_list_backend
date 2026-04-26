import { Request, Response } from 'express';
import Notification from '../models/notification.model';
import User from '../models/user.model';
import { sendPushToTokens } from '../services/fcm.service';

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

  // Send FCM push to matching users
  try {
    const filter: any = { fcmToken: { $exists: true, $ne: null } };
    if (targetRole !== 'all') filter.role = targetRole;
    const users = await User.find(filter).select('fcmToken');
    const tokens = users.map((u: any) => u.fcmToken).filter(Boolean) as string[];
    if (tokens.length > 0) {
      await sendPushToTokens(tokens, title, body, imageUrl, {
        notificationId: notification._id.toString(),
        imageUrl: imageUrl || '',
        targetRole,
      });
    }
  } catch (e) {
    // Push notification failure should not block the response
  }

  res.status(201).json(notification);
};

export const getNotifications = async (req: Request, res: Response) => {
  const userRole = (req as any).user.role;
  
  // Filter notifications by targetRole
  const filter: any = {
    $or: [
      { targetRole: 'all' },
      { targetRole: userRole },
    ]
  };
  
  const notifications = await Notification.find(filter)
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
