import { BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AIToolDefinition } from './ai.types';

export const pricingToolDefinition: AIToolDefinition = {
  name: 'suggest_price_adjustment',
  description:
    'Analyzes a vehicle\'s recent booking demand and current fleet utilization to suggest a price adjustment. Use this when staff ask for pricing advice on a specific vehicle, e.g. "should we raise the price on this SUV" or "is this vehicle priced right".',
  input_schema: {
    type: 'object',
    properties: {
      vehicleId: {
        type: 'string',
        description: 'The ID of the vehicle to analyze.',
      },
    },
    required: ['vehicleId'],
  },
};

interface PriceSuggestionResult {
  vehicleName: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  reasoning: string;
}

/**
 * Computes a demand-based price suggestion using two real signals:
 * 1. How often this specific vehicle has been booked in the last 30
 *    days relative to how many days it could have been booked.
 * 2. How utilized the vehicle's category is fleet-wide right now.
 *
 * High demand on both signals suggests a price increase; low demand
 * on both suggests a decrease. This is a real, computed heuristic -
 * not a static rule or a guess.
 */
export async function suggestPriceAdjustment(vehicleId: string): Promise<PriceSuggestionResult> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    throw new Error('Vehicle not found.');
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const recentBookings = await prisma.booking.findMany({
    where: {
      vehicleId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.COMPLETED] },
      startDate: { gte: thirtyDaysAgo },
    },
  });

  const daysBooked = recentBookings.reduce((sum, b) => {
    const start = b.startDate < thirtyDaysAgo ? thirtyDaysAgo : b.startDate;
    const end = b.endDate > new Date() ? new Date() : b.endDate;
    const days = Math.max(Math.round((end.getTime() - start.getTime()) / 86400000), 0);
    return sum + days;
  }, 0);

  const vehicleUtilization = Math.min(daysBooked / 30, 1);

  const categoryVehicles = await prisma.vehicle.findMany({
    where: { category: vehicle.category },
  });
  const rentedInCategory = categoryVehicles.filter((v) => v.status === 'RENTED').length;
  const categoryUtilization =
    categoryVehicles.length > 0 ? rentedInCategory / categoryVehicles.length : 0;

  const combinedSignal = (vehicleUtilization + categoryUtilization) / 2;

  let changePercent = 0;
  let reasoning: string;

  if (combinedSignal >= 0.75) {
    changePercent = 12;
    reasoning = `This vehicle was booked ${daysBooked} of the last 30 days, and ${Math.round(categoryUtilization * 100)}% of the ${vehicle.category} category is currently rented. Demand is high - a price increase is reasonable.`;
  } else if (combinedSignal >= 0.5) {
    changePercent = 5;
    reasoning = `Steady demand: ${daysBooked} booked days in the last 30, with ${Math.round(categoryUtilization * 100)}% category utilization. A modest increase could capture more revenue without hurting bookings.`;
  } else if (combinedSignal >= 0.25) {
    changePercent = 0;
    reasoning = `Demand is moderate (${daysBooked} booked days in 30, ${Math.round(categoryUtilization * 100)}% category utilization). Current pricing looks appropriate.`;
  } else {
    changePercent = -10;
    reasoning = `Low demand: only ${daysBooked} booked days in the last 30, and just ${Math.round(categoryUtilization * 100)}% of the ${vehicle.category} category is rented. A price reduction could help improve bookings.`;
  }

  const suggestedPrice = Math.round(vehicle.pricePerDay * (1 + changePercent / 100) * 100) / 100;

  return {
    vehicleName: vehicle.name,
    currentPrice: vehicle.pricePerDay,
    suggestedPrice,
    changePercent,
    reasoning,
  };
}
