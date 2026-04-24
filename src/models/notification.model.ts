import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  body: string;
  imageUrl?: string;
  targetRole: 'all' | 'patient' | 'doctor' | 'ambulance_user';
  sentBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    imageUrl: { type: String },
    targetRole: { type: String, enum: ['all', 'patient', 'doctor', 'ambulance_user'], default: 'all' },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', notificationSchema);
