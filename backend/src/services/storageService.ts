import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { getSupabaseClient, BUCKET_NAME } from '../config/supabase';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function uploadImageToStorage(
  file: Express.Multer.File,
  folder: 'potholes' | 'repairs' = 'potholes'
): Promise<string> {
  const isProduction = process.env.NODE_ENV === 'production';
  const client = getSupabaseClient();

  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const uniqueId = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const filename = `img-${uniqueId}${ext}`;
  const storagePath = `${folder}/${filename}`;

  // 1. If Supabase storage is configured, upload directly to Supabase Storage Bucket
  if (client) {
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage Upload Error:', error);
      throw new Error(`Failed to upload image to cloud storage: ${error.message}`);
    }

    return data.path; // e.g. "potholes/img-1724600000-a1b2c3.jpg"
  }

  // 2. In Production mode, MUST NOT fall back to local filesystem storage
  if (isProduction) {
    throw new Error('Supabase Storage configuration missing in production environment');
  }

  // 3. Fallback: Save to local disk for offline dev ONLY when NODE_ENV !== 'production'
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const localFilePath = path.join(UPLOAD_DIR, filename);
  await fs.promises.writeFile(localFilePath, file.buffer);
  return `/uploads/${filename}`;
}

export async function resolveImageUrl(
  imagePathOrUrl: string | null | undefined
): Promise<string> {
  if (!imagePathOrUrl) return '';

  // Return full HTTP URLs (e.g. Unsplash seed data) or local relative URLs as-is
  if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://') || imagePathOrUrl.startsWith('/uploads/')) {
    return imagePathOrUrl;
  }

  const client = getSupabaseClient();

  // If stored in Supabase Storage, generate a secure 1-hour signed URL
  if (client) {
    try {
      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .createSignedUrl(imagePathOrUrl, 3600); // 1 hour expiration

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err) {
      console.warn(`Failed to resolve signed URL for ${imagePathOrUrl}:`, err);
    }
  }

  return imagePathOrUrl;
}
