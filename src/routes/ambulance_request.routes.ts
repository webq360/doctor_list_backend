import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  createRequest, getRequests, getMyRequests,
  placeBid, getBidsForRequest, acceptBid,
  updateDriverLocation, getRequestTracking, updateTripStatus,
} from '../controllers/ambulance_request.controller';

const router = Router();

// Patient
router.post('/', protect, authorize('patient'), createRequest);
router.get('/my', protect, authorize('patient'), getMyRequests);
router.get('/:requestId/bids', protect, getBidsForRequest);
router.post('/:requestId/bids/:bidId/accept', protect, authorize('patient'), acceptBid);
router.get('/:requestId/tracking', protect, getRequestTracking);

// Ambulance user + Admin
router.get('/', protect, authorize('ambulance_user', 'admin'), getRequests);
router.post('/:requestId/bids', protect, authorize('ambulance_user'), placeBid);
router.post('/:requestId/location', protect, authorize('ambulance_user'), updateDriverLocation);
router.patch('/:requestId/status', protect, authorize('ambulance_user'), updateTripStatus);

export default router;
