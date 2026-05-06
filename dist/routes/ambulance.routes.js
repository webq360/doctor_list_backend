"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const ambulance_controller_1 = require("../controllers/ambulance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: (req, file) => ({
        folder: `doctor-list/ambulances/${file.fieldname}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        transformation: file.fieldname.includes('Image') ? [{ width: 800, crop: 'limit' }] : undefined,
    }),
});
const upload = (0, multer_1.default)({ storage }).fields([
    { name: 'driverImage', maxCount: 1 },
    { name: 'ambulanceImage', maxCount: 1 },
    { name: 'drivingLicence', maxCount: 1 },
    { name: 'nid', maxCount: 1 },
    { name: 'carDocument', maxCount: 1 },
]);
const router = (0, express_1.Router)();
router.get('/', ambulance_controller_1.getAllAmbulances);
router.get('/hospital-users', ambulance_controller_1.getHospitalAmbulanceUsers);
router.post('/hospital', upload, ambulance_controller_1.createHospitalAmbulance); // New endpoint for hospital ambulances (no auth)
router.post('/book', auth_middleware_1.protect, ambulance_controller_1.bookAmbulance);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), upload, ambulance_controller_1.registerAmbulance);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), ambulance_controller_1.updateAmbulance);
router.patch('/:id/status', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), ambulance_controller_1.updateAmbulanceStatus);
exports.default = router;
