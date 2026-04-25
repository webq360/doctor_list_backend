"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doctor_controller_1 = require("../controllers/doctor.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', doctor_controller_1.getAllDoctors);
router.get('/all', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    const Doctor = require('../models/doctor.model').default;
    const doctors = await Doctor.find().populate('userId', 'name email phone').populate('hospitalId', 'name');
    res.json(doctors);
});
router.get('/:id', doctor_controller_1.getDoctorById);
router.post('/profile', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('doctor'), doctor_controller_1.createDoctorProfile);
router.post('/admin/create', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), doctor_controller_1.adminCreateDoctor);
router.put('/profile', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('doctor'), doctor_controller_1.updateDoctorProfile);
router.patch('/:id/approve', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), doctor_controller_1.approveDoctor);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const Doctor = require('../models/doctor.model').default;
        const User = require('../models/user.model').default;
        const { userName, userPhone, newPassword, ...doctorFields } = req.body;
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor)
            return res.status(404).json({ message: 'Doctor not found' });
        // Update user info
        if (userName || userPhone || newPassword) {
            const userUpdate = {};
            if (userName)
                userUpdate.name = userName;
            if (userPhone)
                userUpdate.phone = userPhone;
            if (newPassword)
                userUpdate.password = newPassword;
            const user = await User.findById(doctor.userId);
            if (user) {
                Object.assign(user, userUpdate);
                await user.save();
            }
        }
        const updated = await Doctor.findByIdAndUpdate(req.params.id, doctorFields, { new: true })
            .populate('userId', 'name email phone').populate('hospitalId', 'name');
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), doctor_controller_1.deleteDoctor);
exports.default = router;
