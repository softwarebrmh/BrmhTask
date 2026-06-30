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
  smtp: {
    host: process.env.SMTP_HOST ?? 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT ?? '2525', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'BHRM Teams <noreply@bhrm.local>',
  },
}));
