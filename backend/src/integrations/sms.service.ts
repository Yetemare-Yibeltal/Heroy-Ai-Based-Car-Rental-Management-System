import twilio, { Twilio } from 'twilio';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let client: Twilio | null = null;

function getClient(): Twilio | null {
  if (client) return client;

  if (!env.twilio.accountSid || !env.twilio.authToken) {
    logger.warn('Twilio credentials are not configured. SMS will be logged instead of sent.');
    return null;
  }

  client = twilio(env.twilio.accountSid, env.twilio.authToken);
  return client;
}

async function sendSms(to: string, body: string): Promise<void> {
  const smsClient = getClient();

  if (!smsClient || !env.twilio.phoneNumber) {
    logger.info(`[SMS - not sent, Twilio not configured] To: ${to} | Body: ${body}`);
    return;
  }

  try {
    await smsClient.messages.create({
      to,
      from: env.twilio.phoneNumber,
      body,
    });
    logger.info(`SMS sent to ${to}`);
  } catch (err) {
    logger.error(`Failed to send SMS to ${to}`, err as Error);
  }
}

export async function sendBookingConfirmationSms(
  phone: string,
  vehicleName: string,
  startDate: Date
): Promise<void> {
  await sendSms(
    phone,
    `HEROY: Your booking for the ${vehicleName} is confirmed. Pickup: ${startDate.toDateString()}. Thank you for choosing HEROY!`
  );
}

export async function sendPickupReminderSms(
  phone: string,
  vehicleName: string,
  locationName: string
): Promise<void> {
  await sendSms(
    phone,
    `HEROY: Reminder - your ${vehicleName} pickup is coming up at ${locationName}. Please bring your driver's license.`
  );
}

export async function sendReturnReminderSms(phone: string, vehicleName: string): Promise<void> {
  await sendSms(
    phone,
    `HEROY: Reminder - your rental of the ${vehicleName} is due for return today. Late returns may incur additional charges.`
  );
}

export async function sendPaymentReceivedSms(phone: string, amount: number): Promise<void> {
  await sendSms(phone, `HEROY: Payment of $${amount.toFixed(2)} received. Thank you!`);
}
