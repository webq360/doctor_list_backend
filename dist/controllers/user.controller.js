"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFcmToken = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = exports.changePassword = exports.updateMe = exports.getMe = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const getMe = async (req, res) => {
    const user = await user_model_1.default.findById(req.user.id).select('-password');
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
};
exports.getMe = getMe;
const updateMe = async (req, res) => {
    const { name, email, phone, imageUrl } = req.body;
    const update = {};
    if (name)
        update.name = name;
    if (email)
        update.email = email;
    if (phone)
        update.phone = phone;
    if (imageUrl !== undefined)
        update.imageUrl = imageUrl;
    const user = await user_model_1.default.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    res.json(user);
};
exports.updateMe = updateMe;
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
        return res.status(400).json({ message: 'Both fields required' });
    const user = await user_model_1.default.findById(req.user.id);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    const match = await user.comparePassword(currentPassword);
    if (!match)
        return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
};
exports.changePassword = changePassword;
const getAllUsers = async (req, res) => {
    const filter = req.query.role ? { role: req.query.role } : {};
    const users = await user_model_1.default.find(filter).select('-password');
    res.json(users);
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    const user = await user_model_1.default.findById(req.params.id).select('-password');
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
};
exports.getUserById = getUserById;
const updateUser = async (req, res) => {
    const user = await user_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    await user_model_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
};
exports.deleteUser = deleteUser;
const saveFcmToken = async (req, res) => {
    const { fcmToken } = req.body;
    if (!fcmToken)
        return res.status(400).json({ message: 'fcmToken is required' });
    await user_model_1.default.findByIdAndUpdate(req.user.id, { fcmToken });
    res.json({ message: 'FCM token saved' });
};
exports.saveFcmToken = saveFcmToken;
