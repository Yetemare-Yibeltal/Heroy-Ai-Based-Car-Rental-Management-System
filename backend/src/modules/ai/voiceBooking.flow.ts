import { createBooking } from '../bookings/bookings.service';
import { AIToolDefinition } from './ai.types';

export const voiceBookingToolDefinition: AIToolDefinition = {
  name: 'create_booking_from_conversation',
  description:
    'Creates a real booking on behalf of the logged-in customer, using details gathered during the conversation (vehicle, dates, and any add-ons). Only call this after the customer has explicitly confirmed they want to book - read back the vehicle, dates, and total price, and wait for a clear "yes" before calling this tool. Never call this speculatively or without explicit confirmation.',
  input_schema: {
    type: 'object',
    properties: {
      vehicleId: {
        type: 'string',
        description: 'The ID of the vehicle to book, from a prior search_vehicles result.',
      },
      startDate: {
        type: 'string',
        description: 'Pickup date in YYYY-MM-DD format.',
      },
      endDate: {
        type: 'string',
        description: 'Return date in YYYY-MM-DD format.',
      },
      insuranceAddOn: {
        type: 'boolean',
        description:
          'Whether the customer wants the insurance add-on. Defaults to false if not mentioned.',
      },
    },
    required: ['vehicleId', 'startDate', 'endDate'],
  },
};

interface VoiceBookingInput {
  vehicleId: string;
  startDate: string;
  endDate: string;
  insuranceAddOn?: boolean;
}

/**
 * Executes a booking creation triggered from an AI conversation.
 * Reuses the exact same bookings.service.ts logic as the website's
 * booking flow - the same availability checks, verification
 * requirement, and pricing calculation apply here, so a voice/chat
 * booking can never bypass any real business rule.
 */
export async function executeVoiceBooking(
  userId: string | undefined,
  input: VoiceBookingInput
): Promise<string> {
  if (!userId) {
    return 'The customer needs to be logged in to complete a booking. Ask them to sign in first.';
  }

  try {
    const booking = await createBooking(userId, {
      vehicleId: input.vehicleId,
      startDate: new Date(input.startDate).toISOString(),
      endDate: new Date(input.endDate).toISOString(),
      insuranceAddOn: input.insuranceAddOn ?? false,
    });

    return `Booking created successfully. Booking ID: ${booking.id}, vehicle: ${booking.vehicle.name}, dates: ${booking.startDate.toDateString()} to ${booking.endDate.toDateString()}, total: $${booking.totalPrice}. Status: ${booking.status} (awaiting staff confirmation). Tell the customer their booking is submitted and they'll receive confirmation shortly.`;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred.';
    return `Booking could not be created: ${message}. Explain this to the customer clearly and suggest next steps (e.g. different dates, or completing verification first).`;
  }
}
