import multer from 'multer';
import path from 'path';

// Use memoryStorage so file buffers are passed directly to storageService (Supabase Storage)
const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image file format. Only JPG, PNG, and WebP are allowed.'));
  }
};

const maxMb = Number(process.env.MAX_FILE_SIZE_MB || 5);

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxMb * 1024 * 1024, // MB limit
  },
});
