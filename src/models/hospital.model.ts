import mongoose, { Document, Schema } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  location?: { lat: number; lng: number };
  contactPersons?: Array<{
    name: string;
    designation: string;
    mobile: string;
    whatsapp?: string;
    isPublished?: boolean;
    isForPatient?: boolean;
    isForDoctorList?: boolean;
  }>;
  status?: 'active' | 'paused';
  showInHome?: boolean;  // New field for home page visibility
  isPopular?: boolean;   // Mark hospital as popular
  callActive?: boolean;  // Enable/disable call functionality
  bookAppointmentActive?: boolean;  // Enable/disable appointment booking
  // Legacy fields for backward compatibility
  contactPersonName?: string;
  contactPersonDesignation?: string;
  contactMobile?: string;
  contactWhatsapp?: string;
  contact?: string;
  logo?: string;
  coverImage?: string;
  doctors: mongoose.Types.ObjectId[];
}

const hospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    contactPersons: [{
      name: { type: String, required: true },
      designation: { type: String, required: true },
      mobile: { type: String, required: true },
      whatsapp: { type: String },
      isPublished: { type: Boolean, default: false },
      isForPatient: { type: Boolean, default: false },
      isForDoctorList: { type: Boolean, default: false },
    }],
    status: { type: String, enum: ['active', 'paused'], default: 'active' },
    showInHome: { type: Boolean, default: false },  // New field
    isPopular: { type: Boolean, default: false },   // Popular hospitals
    callActive: { type: Boolean, default: true },   // Call functionality
    bookAppointmentActive: { type: Boolean, default: true },  // Appointment booking
    // Legacy fields for backward compatibility
    contactPersonName: { type: String },
    contactPersonDesignation: { type: String },
    contactMobile: { type: String },
    contactWhatsapp: { type: String },
    contact: { type: String },
    logo: { type: String },
    coverImage: { type: String },
    doctors: [{ type: Schema.Types.ObjectId, ref: 'Doctor' }],
  },
  { timestamps: true }
);

export default mongoose.model<IHospital>('Hospital', hospitalSchema);
