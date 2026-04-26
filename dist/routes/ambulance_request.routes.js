"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const ambulance_request_controller_1 = require("../controllers/ambulance_request.controller");
const router = (0, express_1.Router)();
// Patient
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('patient'), ambulance_request_controller_1.createRequest);
router.get('/my', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('patient'), ambulance_request_controller_1.getMyRequests);
router.get('/:requestId/bids', auth_middleware_1.protect, ambulance_request_controller_1.getBidsForRequest);
router.post('/:requestId/bids/:bidId/accept', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('patient'), ambulance_request_controller_1.acceptBid);
router.get('/:requestId/tracking', auth_middleware_1.protect, ambulance_request_controller_1.getRequestTracking);
// Ambulance user + Admin
router.get('/', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('ambulance_user', 'admin'), ambulance_request_controller_1.getRequests);
router.post('/:requestId/bids', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('ambulance_user'), ambulance_request_controller_1.placeBid);
router.post('/:requestId/location', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('ambulance_user'), ambulance_request_controller_1.updateDriverLocation);
router.patch('/:requestId/status', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('ambulance_user'), ambulance_request_controller_1.updateTripStatus);
exports.default = router;
