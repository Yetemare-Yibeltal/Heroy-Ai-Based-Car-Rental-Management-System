import { prisma } from '../../config/prisma';
import { listVehicles } from '../vehicles/vehicles.service';
import { getQuote } from '../bookings/bookings.service';
import { AIToolDefinition } from './ai.types';
import { pricingToolDefinition, suggestPriceAdjustment } from './pricing.tool';
import { fraudCheckToolDefinition, checkBookingFraudRisk } from './fraudCheck.tool';
import { voiceBookingToolDefinition, executeVoiceBooking } from './voiceBooking.flow';

/**
 * Tool definitions passed to Claude on every request. Claude reads
 * these descriptions to decide, on its own, when a user's question
 * requires looking something up or taking an action, rather than
 * the model guessing an answer.
 */
export const aiToolDefinitions: AIToolDefinition[] = [
  {
    name: 'search_vehicles',
    description:
      "Search HEROY's live vehicle fleet by category, price range, transmission, or fuel type. Use this whenever the customer asks what vehicles are available, or asks for a recommendation based on budget or vehicle type. Returns real, currently available vehicles with their price per day.",
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['ECONOMY', 'SUV', 'LUXURY', 'VAN', 'SPORTS', 'ELECTRIC'],
          description: 'Vehicle category to filter by, if the customer specified one.',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price per day in USD, if the customer mentioned a budget.',
        },
        minSeats: {
          type: 'number',
          description: 'Minimum number of seats needed, if the customer mentioned group size.',
        },
      },
    },
  },
  {
    name: 'get_price_quote',
    description:
      'Calculate a real price quote for a specific vehicle and date range, including any insurance add-on or delivery fee. Use this when the customer asks "how much would it cost" for a specific vehicle and dates.',
    input_schema: {
      type: 'object',
      properties: {
        vehicleId: {
          type: 'string',
          description: 'The ID of the vehicle, from a prior search_vehicles result.',
        },
        startDate: { type: 'string', description: 'Rental start date in YYYY-MM-DD format.' },
        endDate: { type: 'string', description: 'Rental end date in YYYY-MM-DD format.' },
        insuranceAddOn: {
          type: 'boolean',
          description: 'Whether the customer wants the insurance add-on.',
        },
      },
      required: ['vehicleId', 'startDate', 'endDate'],
    },
  },
  {
    name: 'check_booking_status',
    description:
      'Look up the current status of one of the logged-in customer\'s own bookings by booking ID. Use this when the customer asks about an existing reservation, e.g. "is my booking confirmed" or "when do I pick up my car".',
    input_schema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'The booking ID the customer is asking about.' },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'list_locations',
    description:
      "List HEROY's rental branch locations. Use this when the customer asks where they can pick up or return a vehicle.",
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  pricingToolDefinition,
  fraudCheckToolDefinition,
  voiceBookingToolDefinition,
];

interface ToolExecutionContext {
  userId?: string;
}

/**
 * Executes a tool call by name and returns a plain-text result that
 * gets fed back to Claude as the tool's output. Every branch here
 * calls into real, existing services - never fabricated data.
 */
export async function executeAiTool(
  toolName: string,
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  switch (toolName) {
    case 'search_vehicles': {
      const result = await listVehicles({
        page: 1,
        limit: 6,
        category: input.category as any,
        maxPrice: input.maxPrice as number | undefined,
        seats: input.minSeats as number | undefined,
        status: 'AVAILABLE',
      });

      if (result.vehicles.length === 0) {
        return 'No vehicles currently match those criteria.';
      }

      return result.vehicles
        .map(
          (v) =>
            `${v.name} (${v.brand}) - ${v.category}, ${v.seats} seats, ${v.transmission}, $${v.pricePerDay}/day, ID: ${v.id}`
        )
        .join('\n');
    }

    case 'get_price_quote': {
      const quote = await getQuote(
        input.vehicleId as string,
        new Date(input.startDate as string).toISOString(),
        new Date(input.endDate as string).toISOString(),
        Boolean(input.insuranceAddOn),
        false
      );

      return `Quote: ${quote.days} day(s) at $${quote.pricePerDay}/day = $${quote.subtotal} subtotal, +$${quote.insuranceCost} insurance, total: $${quote.total}`;
    }

    case 'check_booking_status': {
      if (!context.userId) {
        return 'The customer needs to be logged in to check a booking status.';
      }

      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId as string },
        include: { vehicle: true },
      });

      if (!booking || booking.userId !== context.userId) {
        return 'No booking found with that ID for this customer.';
      }

      return `Booking ${booking.id}: ${booking.vehicle.name}, status: ${booking.status}, from ${booking.startDate.toDateString()} to ${booking.endDate.toDateString()}, total: $${booking.totalPrice}`;
    }

    case 'list_locations': {
      const locations = await prisma.location.findMany();
      return locations.map((l) => `${l.name} - ${l.address}, ${l.city}`).join('\n');
    }

    case 'suggest_price_adjustment': {
      const result = await suggestPriceAdjustment(input.vehicleId as string);
      return `${result.vehicleName}: current price $${result.currentPrice}/day, suggested price $${result.suggestedPrice}/day (${result.changePercent > 0 ? '+' : ''}${result.changePercent}%). Reasoning: ${result.reasoning}`;
    }

    case 'check_booking_fraud_risk': {
      const result = await checkBookingFraudRisk(input.bookingId as string);
      return `Fraud risk for booking ${result.bookingId}: ${result.riskLevel} (score: ${result.riskScore}/100). Signals: ${result.signals.join(' ')} Recommendation: ${result.recommendation}`;
    }

    case 'create_booking_from_conversation': {
      return executeVoiceBooking(context.userId, {
        vehicleId: input.vehicleId as string,
        startDate: input.startDate as string,
        endDate: input.endDate as string,
        insuranceAddOn: input.insuranceAddOn as boolean | undefined,
      });
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}
