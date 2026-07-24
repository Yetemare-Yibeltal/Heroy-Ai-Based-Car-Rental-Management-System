import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { logger } from '../../utils/logger';
import nodemailer from 'nodemailer';
import { env } from '../../config/env';

interface ContactFormInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactForm(req: Request, res: Response): Promise<void> {
  const { name, email, subject, message } = req.body as ContactFormInput;

  if (!env.email.smtpHost) {
    logger.info(`[CONTACT FORM - not emailed, SMTP not configured] From: ${name} <${email}> | ${subject}: ${message}`);
    sendSuccess(res, 200, 'Your message has been received. We will get back to you shortly.', null);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.email.smtpHost,
      port: env.email.smtpPort ?? 587,
      secure: env.email.smtpPort === 465,
      auth: env.email.smtpUser ? { user: env.email.smtpUser, pass: env.email.smtpPassword } : undefined,
    });

    await transporter.sendMail({
      from: env.email.from ?? '"HEROY Website" <no-reply@heroy.example>',
      to: env.email.from ?? 'support@heroy.example',
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`,
    });
  } catch (err) {
    logger.error('Failed to send contact form email', err as Error);
  }

  sendSuccess(res, 200, 'Your message has been received. We will get back to you shortly.', null);
}
