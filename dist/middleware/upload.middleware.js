"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const makeStorage = (folder) => new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: {
        folder: `doctor-list/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, crop: 'limit' }],
    },
});
const uploadSingle = (folder) => (0, multer_1.default)({ storage: makeStorage(folder) }).single('image');
exports.uploadSingle = uploadSingle;
const uploadMultiple = (folder, maxCount = 5) => (0, multer_1.default)({ storage: makeStorage(folder) }).array('images', maxCount);
exports.uploadMultiple = uploadMultiple;
