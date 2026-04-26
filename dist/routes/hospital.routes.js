"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hospital_controller_1 = require("../controllers/hospital.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', hospital_controller_1.getAllHospitals);
router.get('/nearest', hospital_controller_1.getNearestHospitals);
router.get('/:id', hospital_controller_1.getHospitalById);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.createHospital);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.updateHospital);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.deleteHospital);
// Doctors
router.get('/:id/doctors', hospital_controller_1.getHospitalDoctors);
router.post('/:id/doctors', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.addDoctorToHospital);
router.delete('/:id/doctors/:doctorId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.removeDoctorFromHospital);
// Doctor hospital-specific schedule
router.get('/:id/doctors/:doctorId/schedule', hospital_controller_1.getDoctorHospitalSchedule);
router.put('/:id/doctors/:doctorId/schedule', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.setDoctorHospitalSchedule);
// Ambulances
router.get('/:id/ambulances', hospital_controller_1.getHospitalAmbulances);
router.post('/:id/ambulances', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.addAmbulanceToHospital);
router.delete('/:id/ambulances/:ambulanceId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.removeAmbulanceFromHospital);
// Services
router.get('/:id/services', hospital_controller_1.getHospitalServices);
router.post('/:id/services', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.addHospitalService);
router.put('/:id/services/:serviceId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.updateHospitalService);
router.delete('/:id/services/:serviceId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), hospital_controller_1.removeHospitalService);
exports.default = router;
