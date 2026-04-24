import mongoose, { Document, Schema } from 'mongoose';

export interface IAmbulanceRequest extends Document {
  patientId: mongoose.Types.ObjectId;
  pickupLocation: { lat: number; lng: number; address: string };
  status: 'pending' | 'bidding' | 'accepted' | 'completed' | 'cancelled';
  acceptedBidId?: mongoose.Types.ObjectId;
  notes?: string;
}

const ambulanceRequestSchema = new Schema<IAmbulanceRequest>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pickupLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
    },
    status: { type: String, enum: ['pending', 'bidding', 'accepted', 'completed', 'cancelled'], default: 'pending' },
    acceptedBidId: { type: Schema.Types.ObjectId, ref: 'AmbulanceBid' },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAmbulanceRequest>('AmbulanceRequest', ambulanceRequestSchema);
