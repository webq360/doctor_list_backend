import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import doctorRoutes from './routes/doctor.routes';
import hospitalRoutes from './routes/hospital.routes';
import appointmentRoutes from './routes/appointment.routes';
import ambulanceRoutes from './routes/ambulance.routes';
import ambulanceRequestRoutes from './routes/ambulance_request.routes';
import hospitalAmbulanceUserRoutes from './routes/hospital_ambulance_user.routes';
import bannerRoutes from './routes/banner.routes';
import uploadRoutes from './routes/upload.routes';
import bloodBankRoutes from './routes/blood_bank.routes';
import physiotherapyCenterRoutes from './routes/physiotherapy_center.routes';
import notificationRoutes from './routes/notification.routes';
import eyeCareCenterRoutes from './routes/eye_care_center.routes';
import hearingAidCenterRoutes from './routes/hearing_aid_center.routes';
import dentalClinicRoutes from './routes/dental_clinic.routes';
import drugRehabilitationCenterRoutes from './routes/drug_rehabilitation_center.routes';
import diseaseCategoryRoutes from './routes/disease_category.routes';
import departmentRoutes from './routes/department.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['https://doctorlist-admin.vercel.app', 'https://doctor-list-backend-x5qp.vercel.app', 'http://localhost:3000', 'http://localhost:5000'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/', (_req, res) => {
  res.send({ status: 'ok', message: 'Doctor List backend is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/ambulance', ambulanceRoutes);
app.use('/api/v1/ambulance-requests', ambulanceRequestRoutes);
app.use('/api/v1/hospital-ambulance-users', hospitalAmbulanceUserRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/blood-banks', bloodBankRoutes);
app.use('/api/v1/physiotherapy-centers', physiotherapyCenterRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/eye-care-centers', eyeCareCenterRoutes);
app.use('/api/v1/hearing-aid-centers', hearingAidCenterRoutes);
app.use('/api/v1/dental-clinics', dentalClinicRoutes);
app.use('/api/v1/drug-rehabilitation-centers', drugRehabilitationCenterRoutes);
app.use('/api/v1/disease-categories', diseaseCategoryRoutes);
app.use('/api/v1/departments', departmentRoutes);
// Alias: admin dashboard uses /diseases, Flutter uses /disease-categories — both point to same handler
app.use('/api/v1/diseases', diseaseCategoryRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

export default app;
