import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const makeStorage = (folder: string) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `doctor-list/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, crop: 'limit' }],
    } as any,
  });

export const uploadSingle = (folder: string) =>
  multer({ storage: makeStorage(folder) }).single('image');

export const uploadMultiple = (folder: string, maxCount = 5) =>
  multer({ storage: makeStorage(folder) }).array('images', maxCount);
