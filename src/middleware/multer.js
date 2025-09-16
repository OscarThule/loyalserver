import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Log to verify CLOUDINARY_URL
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL);

// Cloudinary automatically parses CLOUDINARY_URL, no need for explicit config
console.log('Cloudinary config:', cloudinary.config());

// Multer storage using Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const params = {
      folder: 'posts',
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname}`
    };
    console.log('Cloudinary params:', params); // Debug params
    return params;
  }
});

// Multer instance
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max size
});

export default upload;