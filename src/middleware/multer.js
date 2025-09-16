import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer storage using Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'posts',          // folder in your Cloudinary account
    resource_type: 'auto',    // 'auto' allows any kind of media
    public_id: `${Date.now()}-${file.originalname}`
  })
});

// Multer instance
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max size
});

export default upload;
