import { Request, Response } from 'express';
import Ambulance from '../models/ambulance.model';
import User from '../models/user.model';
import HospitalAmbulanceUser from '../models/hospital_ambulance_user.model';
import { generateToken } from '../utils/jwt.util';

export const registerAmbulance = async (req: Request, res: Response) => {
  try {
    const {
      ambulanceName, driverName, phone, email, vehicleNumber,
      ambulanceType, address, password, type = 'app_user', userId,
    } = req.body;

  if (!ambulanceName || !phone) {
      return res.status(400).json({ message: 'Ambulance name and phone are required' });
    }

    // Create ambulance_user account only if password provided
    let finalUserId = userId; // Use provided userId or create new one
    if (password && !userId) {
      const existingUser = email ? await User.findOne({ email }) : null;
      if (existingUser) return res.status(409).json({ message: 'Email already registered' });
      const user = await User.create({
        name: driverName || ambulanceName,
        email: email || `${phone}@ambulance.local`,
        phone,
        password,
        role: 'ambulance_user',
      });
      finalUserId = user._id;
    }

    // Handle uploaded files
    const files = req.files as Record<string, Express.Multer.File[]>;
    const getUrl = (key: string) => files?.[key]?.[0]?.path || undefined;

    const ambulance = await Ambulance.create({
      ambulanceName, driverName, phone, email, vehicleNumber,
      ambulanceType, address,
      type, // Set the type
      userId: finalUserId,
      driverImage: getUrl('driverImage'),
      ambulanceImage: getUrl('ambulanceImage'),
      documents: {
        drivingLicence: getUrl('drivingLicence'),
        nid: getUrl('nid'),
        carDocument: getUrl('carDocument'),
      },
    });

    res.status(201).json({ ambulance, ...(finalUserId ? { user: { id: finalUserId } } : {}) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllAmbulances = async (req: Request, res: Response) => {
  const ambulances = await Ambulance.find().populate('hospitalId', 'name address').populate('userId', 'name email');
  res.json(ambulances);
};

export const bookAmbulance = async (req: Request, res: Response) => {
  const ambulance = await Ambulance.findOneAndUpdate(
    { status: 'available' },
    { status: 'busy' },
    { new: true }
  );
  if (!ambulance) return res.status(404).json({ message: 'No ambulance available' });
  res.json({ message: 'Ambulance booked', ambulance });
};

export const updateAmbulance = async (req: Request, res: Response) => {
  const ambulance = await Ambulance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });
  res.json(ambulance);
};

export const updateAmbulanceStatus = async (req: Request, res: Response) => {
  const ambulance = await Ambulance.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });
  res.json(ambulance);
};

export const createHospitalAmbulance = async (req: Request, res: Response) => {
  try {
    const {
      ambulanceName, driverName, phone, email, vehicleNumber,
      ambulanceType, address, hospitalAmbulanceUserId, type = 'hospital',
    } = req.body;

    console.log('Creating hospital ambulance with:', { ambulanceName, driverName, phone, hospitalAmbulanceUserId, type });

    if (!ambulanceName || !phone || !hospitalAmbulanceUserId) {
      return res.status(400).json({ message: 'Ambulance name, phone, and hospitalAmbulanceUserId are required' });
    }

    // Handle uploaded files
    const files = req.files as Record<string, Express.Multer.File[]>;
    const getUrl = (key: string) => files?.[key]?.[0]?.path || undefined;

    const ambulance = await Ambulance.create({
      ambulanceName, driverName, phone, email, vehicleNumber,
      ambulanceType, address,
      type,
      hospitalAmbulanceUserId,
      driverImage: getUrl('driverImage'),
      ambulanceImage: getUrl('ambulanceImage'),
      documents: {
        drivingLicence: getUrl('drivingLicence'),
        nid: getUrl('nid'),
        carDocument: getUrl('carDocument'),
      },
    });

    console.log('Hospital ambulance created:', ambulance);
    res.status(201).json({ ambulance });
  } catch (err: any) {
    console.error('Error creating hospital ambulance:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getHospitalAmbulanceUsers = async (req: Request, res: Response) => {
  try {
    console.log('Fetching hospital ambulance users...');
    
    // Get all hospital ambulance users
    const users = await HospitalAmbulanceUser.find({ isActive: true }).select('name phone');
    
    console.log('Found hospital ambulance users:', users.length);
    console.log('Users:', users);
    
    res.json(users);
  } catch (err: any) {
    console.error('Error in getHospitalAmbulanceUsers:', err);
    res.status(500).json({ message: err.message });
  }
};
