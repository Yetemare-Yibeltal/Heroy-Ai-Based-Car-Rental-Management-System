import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(10, 'JWT_ACCESS_SECRET must be set and reasonably long'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET must be set and reasonably long'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  CHAPA_SECRET_KEY: z.string().optional(),
  CHAPA_PUBLIC_KEY: z.string().optional(),
  CHAPA_WEBHOOK_SECRET: z.string().optional(),
  CHAPA_BASE_URL: z.string().default('https://api.chapa.co/v1'),

  EMAIL_FROM: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  SENTRY_DSN: z.string().optional(),

  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_CONTACT_EMAIL: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed. Check your .env file against .env.example.');
}

const raw = parsed.data;

export const env = {
  nodeEnv: raw.NODE_ENV,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  port: parseInt(raw.PORT, 10),
  clientUrl: raw.CLIENT_URL,

  databaseUrl: raw.DATABASE_URL,

  jwt: {
    accessSecret: raw.JWT_ACCESS_SECRET,
    refreshSecret: raw.JWT_REFRESH_SECRET,
    accessExpiresIn: raw.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: raw.JWT_REFRESH_EXPIRES_IN,
  },

  anthropic: {
    apiKey: raw.ANTHROPIC_API_KEY,
    model: raw.ANTHROPIC_MODEL,
  },

  stripe: {
    secretKey: raw.STRIPE_SECRET_KEY,
    webhookSecret: raw.STRIPE_WEBHOOK_SECRET,
  },

  chapa: {
    secretKey: raw.CHAPA_SECRET_KEY,
    publicKey: raw.CHAPA_PUBLIC_KEY,
    webhookSecret: raw.CHAPA_WEBHOOK_SECRET,
    baseUrl: raw.CHAPA_BASE_URL,
  },

  email: {
    from: raw.EMAIL_FROM,
    smtpHost: raw.SMTP_HOST,
    smtpPort: raw.SMTP_PORT ? parseInt(raw.SMTP_PORT, 10) : undefined,
    smtpUser: raw.SMTP_USER,
    smtpPassword: raw.SMTP_PASSWORD,
  },

  twilio: {
    accountSid: raw.TWILIO_ACCOUNT_SID,
    authToken: raw.TWILIO_AUTH_TOKEN,
    phoneNumber: raw.TWILIO_PHONE_NUMBER,
  },

  cloudinary: {
    cloudName: raw.CLOUDINARY_CLOUD_NAME,
    apiKey: raw.CLOUDINARY_API_KEY,
    apiSecret: raw.CLOUDINARY_API_SECRET,
  },

  sentryDsn: raw.SENTRY_DSN,

  vapid: {
    publicKey: raw.VAPID_PUBLIC_KEY,
    privateKey: raw.VAPID_PRIVATE_KEY,
    contactEmail: raw.VAPID_CONTACT_EMAIL,
  },

  rateLimit: {
    windowMs: parseInt(raw.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(raw.RATE_LIMIT_MAX_REQUESTS, 10),
  },
};
