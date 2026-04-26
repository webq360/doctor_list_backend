"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTripStatus = exports.getRequestTracking = exports.updateDriverLocation = exports.acceptBid = exports.getBidsForRequest = exports.placeBid = exports.getMyRequests = exports.getRequests = exports.createRequest = void 0;
const zod_1 = require("zod");
const ambulance_request_model_1 = __importDefault(require("../models/ambulance_request.model"));
const ambulance_bid_model_1 = __importDefault(require("../models/ambulance_bid.model"));
// Patient: create request
const createRequest = async (req, res) => {
    const schema = zod_1.z.object({
        pickupLocation: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number(), address: zod_1.z.string() }),
        destination: zod_1.z.object({ lat: zod_1.z.number().optional(), lng: zod_1.z.number().optional(), address: zod_1.z.string() }),
        tripType: zod_1.z.enum(['instant', 'scheduled']).default('instant'),
        scheduledTime: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ errors: parsed.error.flatten() });
    const request = await ambulance_request_model_1.default.create({ patientId: req.user.id, ...parsed.data });
    res.status(201).json(request);
};
exports.createRequest = createRequest;
// Ambulance user / Admin: get all pending requests
const getRequests = async (req, res) => {
    const filter = req.user.role === 'ambulance_user' ? { status: { $in: ['pending', 'bidding'] } } : {};
    const requests = await ambulance_request_model_1.default.find(filter)
        .populate('patientId', 'name phone')
        .populate('acceptedBidId')
        .sort({ createdAt: -1 });
    res.json(requests);
};
exports.getRequests = getRequests;
// Patient: get own requests
const getMyRequests = async (req, res) => {
    const requests = await ambulance_request_model_1.default.find({ patientId: req.user.id })
        .populate({ path: 'acceptedBidId', populate: { path: 'ambulanceUserId', select: 'name phone' } })
        .sort({ createdAt: -1 });
    res.json(requests);
};
exports.getMyRequests = getMyRequests;
// Ambulance user: place a bid
const placeBid = async (req, res) => {
    const schema = zod_1.z.object({
        estimatedTime: zod_1.z.number().positive(),
        estimatedDistance: zod_1.z.number().positive(),
        fare: zod_1.z.number().positive(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ errors: parsed.error.flatten() });
    const request = await ambulance_request_model_1.default.findById(req.params.requestId);
    if (!request || !['pending', 'bidding'].includes(request.status))
        return res.status(400).json({ message: 'Request not available for bidding' });
    const bid = await ambulance_bid_model_1.default.create({ requestId: req.params.requestId, ambulanceUserId: req.user.id, ...parsed.data });
    await ambulance_request_model_1.default.findByIdAndUpdate(req.params.requestId, { status: 'bidding' });
    res.status(201).json(bid);
};
exports.placeBid = placeBid;
// Get bids for a request
const getBidsForRequest = async (req, res) => {
    const bids = await ambulance_bid_model_1.default.find({ requestId: req.params.requestId })
        .populate('ambulanceUserId', 'name phone')
        .populate('hospitalId', 'name address');
    res.json(bids);
};
exports.getBidsForRequest = getBidsForRequest;
// Patient: accept a bid
const acceptBid = async (req, res) => {
    const bid = await ambulance_bid_model_1.default.findById(req.params.bidId);
    if (!bid)
        return res.status(404).json({ message: 'Bid not found' });
    const request = await ambulance_request_model_1.default.findOne({ _id: bid.requestId, patientId: req.user.id });
    if (!request)
        return res.status(403).json({ message: 'Not your request' });
    await ambulance_bid_model_1.default.updateMany({ requestId: bid.requestId }, { status: 'rejected' });
    bid.status = 'accepted';
    await bid.save();
    request.status = 'accepted';
    request.acceptedBidId = bid._id;
    await request.save();
    res.json({ message: 'Bid accepted', bid, request });
};
exports.acceptBid = acceptBid;
// Driver: update live location
const updateDriverLocation = async (req, res) => {
    const { lat, lng } = req.body;
    if (!lat || !lng)
        return res.status(400).json({ message: 'lat and lng required' });
    const request = await ambulance_request_model_1.default.findOneAndUpdate({ status: { $in: ['accepted', 'on_the_way', 'arrived', 'trip_started'] } }, { driverLocation: { lat: Number(lat), lng: Number(lng) } }, { new: true });
    res.json({ ok: true, driverLocation: request?.driverLocation });
};
exports.updateDriverLocation = updateDriverLocation;
// Get single request with tracking info
const getRequestTracking = async (req, res) => {
    const request = await ambulance_request_model_1.default.findById(req.params.requestId)
        .populate({ path: 'acceptedBidId', populate: { path: 'ambulanceUserId', select: 'name phone' } });
    if (!request)
        return res.status(404).json({ message: 'Not found' });
    res.json(request);
};
exports.getRequestTracking = getRequestTracking;
// Driver: update trip status
const updateTripStatus = async (req, res) => {
    const { status } = req.body;
    const allowed = ['on_the_way', 'arrived', 'trip_started', 'completed'];
    if (!allowed.includes(status))
        return res.status(400).json({ message: 'Invalid status' });
    const request = await ambulance_request_model_1.default.findByIdAndUpdate(req.params.requestId, { status }, { new: true });
    if (!request)
        return res.status(404).json({ message: 'Not found' });
    res.json(request);
};
exports.updateTripStatus = updateTripStatus;
