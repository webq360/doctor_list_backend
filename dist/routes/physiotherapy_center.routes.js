"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const physiotherapy_center_controller_1 = require("../controllers/physiotherapy_center.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', physiotherapy_center_controller_1.getAllCenters);
router.get('/nearest', physiotherapy_center_controller_1.getNearestCenters);
router.get('/:id', physiotherapy_center_controller_1.getCenterById);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.createCenter);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.updateCenter);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.deleteCenter);
// Doctors
router.get('/:id/doctors', physiotherapy_center_controller_1.getCenterDoctors);
router.post('/:id/doctors', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.addDoctorToCenter);
router.delete('/:id/doctors/:doctorId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.removeDoctorFromCenter);
// Ambulances
router.get('/:id/ambulances', physiotherapy_center_controller_1.getCenterAmbulances);
router.post('/:id/ambulances', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.addAmbulanceToCenter);
router.delete('/:id/ambulances/:ambulanceId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.removeAmbulanceFromCenter);
// Services
router.get('/:id/services', physiotherapy_center_controller_1.getCenterServices);
router.post('/:id/services', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.addCenterService);
router.delete('/:id/services/:serviceId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), physiotherapy_center_controller_1.removeCenterService);
exports.default = router;
