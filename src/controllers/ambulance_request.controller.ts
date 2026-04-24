import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import AmbulanceRequest from '../models/ambulance_request.model';
import AmbulanceBid from '../models/ambulance_bid.model';

// Patient: create request
export const createRequest = async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    pickupLocation: z.object({ lat: z.number(), lng: z.number(), address: z.string() }),
    notes: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const request = await AmbulanceRequest.create({ patientId: req.user!.id, ...parsed.data });
  res.status(201).json(request);
};

// Ambulance user / Admin: get all pending requests
export const getRequests = async (req: AuthRequest, res: Response) => {
  const filter = req.user!.role === 'ambulance_user' ? { status: { $in: ['pending', 'bidding'] } } : {};
  const requests = await AmbulanceRequest.find(filter)
    .populate('patientId', 'name phone')
    .populate('acceptedBidId')
    .sort({ createdAt: -1 });
  res.json(requests);
};

// Patient: get own requests
export const getMyRequests = async (req: AuthRequest, res: Response) => {
  const requests = await AmbulanceRequest.find({ patientId: req.user!.id })
    .populate({ path: 'acceptedBidId', populate: { path: 'hospitalId ambulanceUserId', select: 'name address name phone' } })
    .sort({ createdAt: -1 });
  res.json(requests);
};

// Ambulance user: place a bid
export const placeBid = async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    hospitalId: z.string(),
    estimatedTime: z.number().positive(),
    estimatedDistance: z.number().positive(),
    fare: z.number().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const request = await AmbulanceRequest.findById(req.params.requestId);
  if (!request || !['pending', 'bidding'].includes(request.status))
    return res.status(400).json({ message: 'Request not available for bidding' });

  const bid = await AmbulanceBid.create({ requestId: req.params.requestId, ambulanceUserId: req.user!.id, ...parsed.data });
  await AmbulanceRequest.findByIdAndUpdate(req.params.requestId, { status: 'bidding' });
  res.status(201).json(bid);
};

// Get bids for a request
export const getBidsForRequest = async (req: AuthRequest, res: Response) => {
  const bids = await AmbulanceBid.find({ requestId: req.params.requestId })
    .populate('ambulanceUserId', 'name phone')
    .populate('hospitalId', 'name address');
  res.json(bids);
};

// Patient: accept a bid
export const acceptBid = async (req: AuthRequest, res: Response) => {
  const bid = await AmbulanceBid.findById(req.params.bidId);
  if (!bid) return res.status(404).json({ message: 'Bid not found' });

  const request = await AmbulanceRequest.findOne({ _id: bid.requestId, patientId: req.user!.id });
  if (!request) return res.status(403).json({ message: 'Not your request' });

  await AmbulanceBid.updateMany({ requestId: bid.requestId }, { status: 'rejected' });
  bid.status = 'accepted';
  await bid.save();

  request.status = 'accepted';
  request.acceptedBidId = bid._id as any;
  await request.save();

  res.json({ message: 'Bid accepted', bid, request });
};
