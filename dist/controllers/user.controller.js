"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const getAllUsers = async (req, res) => {
    const users = await user_model_1.default.find().select('-password');
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
