import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'video/mp4',
    'video/quicktime',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  inviteTokenExpiryDays: 7,
}));
