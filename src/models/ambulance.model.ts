import mongoose, { Document, Schema } from 'mongoose';

export interface IAmbulance extends Document {
  ambulanceName: string;
  driverName: string;
  phone: string;
  email?: string;
  vehicleNumber: string;
  ambulanceType: 'AC' | 'Non-AC';
  address: string;
  status: 'available' | 'busy' | 'inactive';
  hospitalId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  driverImage?: string;
  ambulanceImage?: string;
  documents: {
    drivingLicence?: string;
    nid?: string;
    carDocument?: string;
  };
}

const ambulanceSchema = new Schema<IAmbulance>(
  {
    ambulanceName: { type: String, required: true },
    driverName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    vehicleNumber: { type: String, required: true, unique: true },
    ambulanceType: { type: String, enum: ['AC', 'Non-AC'], required: true },
    address: { type: String, required: true },
    status: { type: String, enum: ['available', 'busy', 'inactive'], default: 'available' },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    driverImage: { type: String },
    ambulanceImage: { type: String },
    documents: {
      drivingLicence: { type: String },
      nid: { type: String },
      carDocument: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAmbulance>('Ambulance', ambulanceSchema);
