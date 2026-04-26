"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.updateNotification = exports.getNotifications = exports.sendNotification = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const fcm_service_1 = require("../services/fcm.service");
const sendNotification = async (req, res) => {
    const { title, body, targetRole = 'all', imageUrl } = req.body;
    if (!title || !body)
        return res.status(400).json({ message: 'title and body are required' });
    const notification = await notification_model_1.default.create({
        title,
        body,
        targetRole,
        imageUrl: imageUrl || undefined,
        sentBy: req.user.id,
    });
    // Send FCM push to matching users
    try {
        const filter = { fcmToken: { $exists: true, $ne: null } };
        if (targetRole !== 'all')
            filter.role = targetRole;
        const users = await user_model_1.default.find(filter).select('fcmToken');
        const tokens = users.map((u) => u.fcmToken).filter(Boolean);
        if (tokens.length > 0) {
            await (0, fcm_service_1.sendPushToTokens)(tokens, title, body, imageUrl, {
                notificationId: notification._id.toString(),
                imageUrl: imageUrl || '',
                targetRole,
            });
        }
    }
    catch (e) {
        // Push notification failure should not block the response
    }
    res.status(201).json(notification);
};
exports.sendNotification = sendNotification;
const getNotifications = async (req, res) => {
    const userRole = req.user.role;
    // Filter notifications by targetRole
    const filter = {
        $or: [
            { targetRole: 'all' },
            { targetRole: userRole },
        ]
    };
    const notifications = await notification_model_1.default.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);
    res.json(notifications);
};
exports.getNotifications = getNotifications;
const updateNotification = async (req, res) => {
    const { title, body, targetRole, imageUrl } = req.body;
    const notification = await notification_model_1.default.findByIdAndUpdate(req.params.id, { title, body, targetRole, imageUrl: imageUrl || undefined }, { new: true }).populate('sentBy', 'name email');
    if (!notification)
        return res.status(404).json({ message: 'Not found' });
    res.json(notification);
};
exports.updateNotification = updateNotification;
const deleteNotification = async (req, res) => {
    await notification_model_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
};
exports.deleteNotification = deleteNotification;
