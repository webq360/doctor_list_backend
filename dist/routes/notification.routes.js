"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Any logged-in user can view notifications
router.get('/', auth_middleware_1.protect, notification_controller_1.getNotifications);
// Only admin can send/edit/delete
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), notification_controller_1.sendNotification);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), notification_controller_1.updateNotification);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('admin'), notification_controller_1.deleteNotification);
exports.default = router;
