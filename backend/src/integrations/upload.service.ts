import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';

if (env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
} else {
  logger.warn('Cloudinary credentials are not configured. File uploads will fail until set.');
}

/**
 * Multer configuration for accepting file uploads in memory
 * (rather than writing to local disk first) before streaming
 * them up to Cloudinary. Limits to 8MB and common image types.
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      cb(new AppError('Only JPEG, PNG, WEBP, or PDF files are allowed.', 400));
      return;
    }
    cb(null, true);
  },
});

export type UploadFolder = 'vehicles' | 'verification-documents' | 'inspection-photos' | 'avatars';

/**
 * Uploads a file buffer to Cloudinary under a specific folder and
 * returns the resulting public URL.
 */
export function uploadToCloudinary(fileBuffer: Buffer, folder: UploadFolder): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `heroy/${folder}`, resource_type: 'auto' },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary upload failed', error as Error);
          reject(AppError.internal('File upload failed. Please try again.'));
          return;
        }
        resolve(result.secure_url);
      }
    );

    stream.end(fileBuffer);
  });
}

/**
 * Deletes an uploaded file from Cloudinary by its public ID,
 * extracted from a stored URL. Used when replacing a vehicle
 * image or removing a rejected verification document.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.error(`Failed to delete Cloudinary asset: ${publicId}`, err as Error);
  }
}

/**
 * Extracts the Cloudinary public ID from a full secure_url, so
 * deletion can be performed later without storing the ID separately.
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  const match = cloudinaryUrl.match(/\/heroy\/([^./]+\/[^./]+)\./);
  return match ? `heroy/${match[1]}` : null;
}
