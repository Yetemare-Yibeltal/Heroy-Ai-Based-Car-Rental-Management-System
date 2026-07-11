import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (!env.email.smtpHost || !env.email.smtpUser) {
    logger.warn('SMTP is not configured. Emails will be logged instead of sent.');
  }

  transporter = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort ?? 587,
    secure: env.email.smtpPort === 465,
    auth: env.email.smtpUser
      ? {
          user: env.email.smtpUser,
          pass: env.email.smtpPassword,
        }
      : undefined,
  });

  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!env.email.smtpHost) {
    // No SMTP configured (e.g. local dev without credentials) - log
    // the email instead of failing, so the rest of the flow still works.
    logger.info(
      `[EMAIL - not sent, SMTP not configured] To: ${input.to} | Subject: ${input.subject}`
    );
    return;
  }

  try {
    await getTransporter().sendMail({
      from: env.email.from ?? '"HEROY" <no-reply@heroy.example>',
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    logger.info(`Email sent to ${input.to}: ${input.subject}`);
  } catch (err) {
    logger.error(`Failed to send email to ${input.to}`, err as Error);
  }
}

function emailWrapper(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
    <div style="background: #12151B; padding: 20px; border-radius: 8px 8px 0 0;">
      <span style="color: #F2A93B; font-size: 22px; font-weight: bold;">HEROY</span>
    </div>
    <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
      <h2 style="margin-top: 0;">${title}</h2>
      ${bodyHtml}
      <p style="color: #888; font-size: 12px; margin-top: 32px;">
        HEROY Car Rental &middot; Addis Ababa, Ethiopia
      </p>
    </div>
  </div>`;
}

export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  const html = emailWrapper(
    `Welcome to HEROY, ${firstName}!`,
    `<p>Your account has been created. Browse our fleet and book your first rental whenever you're ready.</p>`
  );
  await sendEmail({ to, subject: 'Welcome to HEROY', html });
}

export async function sendBookingConfirmationEmail(
  to: string,
  firstName: string,
  details: {
    bookingId: string;
    vehicleName: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
  }
): Promise<void> {
  const html = emailWrapper(
    'Your booking is confirmed',
    `<p>Hi ${firstName},</p>
     <p>Your booking for the <strong>${details.vehicleName}</strong> is confirmed.</p>
     <ul>
       <li>Booking ID: ${details.bookingId}</li>
       <li>Pickup: ${details.startDate.toDateString()}</li>
       <li>Return: ${details.endDate.toDateString()}</li>
       <li>Total: $${details.totalPrice.toFixed(2)}</li>
     </ul>
     <p>See you soon!</p>`
  );
  await sendEmail({ to, subject: 'Booking Confirmed - HEROY', html });
}

export async function sendPaymentReceiptEmail(
  to: string,
  firstName: string,
  details: { bookingId: string; amount: number; method: string }
): Promise<void> {
  const html = emailWrapper(
    'Payment received',
    `<p>Hi ${firstName},</p>
     <p>We've received your payment of <strong>$${details.amount.toFixed(2)}</strong> via ${details.method} for booking ${details.bookingId}.</p>
     <p>Your invoice is available in your HEROY dashboard.</p>`
  );
  await sendEmail({ to, subject: 'Payment Receipt - HEROY', html });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetLink: string
): Promise<void> {
  const html = emailWrapper(
    'Reset your password',
    `<p>Hi ${firstName},</p>
     <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
     <p><a href="${resetLink}" style="color: #F2A93B;">Reset Password</a></p>
     <p>If you didn't request this, you can safely ignore this email.</p>`
  );
  await sendEmail({ to, subject: 'Reset Your HEROY Password', html });
}

export async function sendBookingCancelledEmail(
  to: string,
  firstName: string,
  details: { bookingId: string; vehicleName: string }
): Promise<void> {
  const html = emailWrapper(
    'Booking cancelled',
    `<p>Hi ${firstName},</p>
     <p>Your booking (${details.bookingId}) for the ${details.vehicleName} has been cancelled.</p>
     <p>If this wasn't you, please contact support right away.</p>`
  );
  await sendEmail({ to, subject: 'Booking Cancelled - HEROY', html });
}
