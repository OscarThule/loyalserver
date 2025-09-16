import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary with env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'uploads'; // Default folder in Cloudinary
    let resourceType = 'image';

    if (file.mimetype.startsWith('video/')) {
      folder = 'videos';
      resourceType = 'video';
    }

    return {
      folder,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'webm', 'mov'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

// Multer instance (Cloudinary storage + size limits)
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for videos
});

export default upload;
