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
import bannerRoutes from './routes/banner.routes';
import uploadRoutes from './routes/upload.routes';
import bloodBankRoutes from './routes/blood_bank.routes';
import physiotherapyCenterRoutes from './routes/physiotherapy_center.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/ambulance', ambulanceRoutes);
app.use('/api/v1/ambulance-requests', ambulanceRequestRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/blood-banks', bloodBankRoutes);
app.use('/api/v1/physiotherapy-centers', physiotherapyCenterRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

export default app;
