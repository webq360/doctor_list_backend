import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

export const uploadImage = (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No image provided' });
  const file = req.file as Express.Multer.File & { path: string; filename: string };
  res.json({ url: file.path, publicId: file.filename });
};

export const deleteImage = async (req: Request, res: Response) => {
  const { publicId } = req.body;
  if (!publicId) return res.status(400).json({ message: 'publicId required' });
  await cloudinary.uploader.destroy(publicId);
  res.json({ message: 'Image deleted' });
};
