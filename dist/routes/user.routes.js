"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Protected routes for authenticated users (no admin role required)
router.get('/me', auth_middleware_1.protect, user_controller_1.getMe);
router.put('/me', auth_middleware_1.protect, user_controller_1.updateMe);
router.patch('/me', auth_middleware_1.protect, user_controller_1.updateMe);
router.put('/me/password', auth_middleware_1.protect, user_controller_1.changePassword);
router.post('/fcm-token', auth_middleware_1.protect, user_controller_1.saveFcmToken);
// Admin-only routes
router.get('/', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), user_controller_1.getAllUsers);
router.get('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), user_controller_1.getUserById);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), user_controller_1.updateUser);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), user_controller_1.deleteUser);
exports.default = router;
