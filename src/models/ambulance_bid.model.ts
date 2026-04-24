import mongoose, { Document, Schema } from 'mongoose';

export interface IAmbulanceBid extends Document {
  requestId: mongoose.Types.ObjectId;
  ambulanceUserId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  estimatedTime: number; // minutes
  estimatedDistance: number; // km
  fare: number;
  status: 'pending' | 'accepted' | 'rejected';
}

const ambulanceBidSchema = new Schema<IAmbulanceBid>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'AmbulanceRequest', required: true },
    ambulanceUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    estimatedTime: { type: Number, required: true },
    estimatedDistance: { type: Number, required: true },
    fare: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model<IAmbulanceBid>('AmbulanceBid', ambulanceBidSchema);
