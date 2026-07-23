import { Router } from 'express';
import { z } from 'zod';
import { submitContactForm } from './contact.controller';
import { validate } from '../../middleware/validate';
import { catchAsync } from '../../utils/catchAsync';
import rateLimit from 'express-rate-limit';

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Please provide a valid email address'),
  subject: z.string().min(1, 'Subject is required').max(150),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
});

export const contactRoutes = Router();

contactRoutes.post(
  '/',
  contactFormLimiter,
  validate(contactFormSchema),
  catchAsync(submitContactForm)
);
