"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadImage = (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: 'No image provided' });
    const file = req.file;
    res.json({ url: file.path, publicId: file.filename });
};
exports.uploadImage = uploadImage;
const deleteImage = async (req, res) => {
    const { publicId } = req.body;
    if (!publicId)
        return res.status(400).json({ message: 'publicId required' });
    await cloudinary_1.default.uploader.destroy(publicId);
    res.json({ message: 'Image deleted' });
};
exports.deleteImage = deleteImage;
