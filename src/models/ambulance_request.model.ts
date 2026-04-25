import mongoose, { Document, Schema } from 'mongoose';

export interface IAmbulanceRequest extends Document {
  patientId: mongoose.Types.ObjectId;
  pickupLocation: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  tripType: 'instant' | 'scheduled';
  scheduledTime?: string;
  status: 'pending' | 'bidding' | 'accepted' | 'on_the_way' | 'arrived' | 'trip_started' | 'completed' | 'cancelled';
  acceptedBidId?: mongoose.Types.ObjectId;
  notes?: string;
  driverLocation?: { lat: number; lng: number };
}

const ambulanceRequestSchema = new Schema<IAmbulanceRequest>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pickupLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
    },
    destination: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, required: true },
    },
    tripType: { type: String, enum: ['instant', 'scheduled'], default: 'instant' },
    scheduledTime: { type: String },
    status: { type: String, enum: ['pending', 'bidding', 'accepted', 'on_the_way', 'arrived', 'trip_started', 'completed', 'cancelled'], default: 'pending' },
    acceptedBidId: { type: Schema.Types.ObjectId, ref: 'AmbulanceBid' },
    notes: { type: String },
    driverLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAmbulanceRequest>('AmbulanceRequest', ambulanceRequestSchema);
