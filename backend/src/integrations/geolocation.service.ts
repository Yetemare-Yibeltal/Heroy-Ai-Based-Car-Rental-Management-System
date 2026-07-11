import { prisma } from '../config/prisma';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two coordinates
 * using the Haversine formula. Returns distance in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

export interface NearestLocationResult {
  locationId: string;
  name: string;
  address: string;
  city: string;
  distanceKm: number;
}

/**
 * Finds HEROY branch locations nearest to a given coordinate,
 * sorted closest-first. Locations without coordinates set are
 * excluded, since distance can't be calculated for them.
 */
export async function findNearestLocations(
  customerLat: number,
  customerLng: number,
  limit: number = 5
): Promise<NearestLocationResult[]> {
  const locations = await prisma.location.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
  });

  const withDistance = locations
    .map((loc) => ({
      locationId: loc.id,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      distanceKm: calculateDistanceKm(
        customerLat,
        customerLng,
        loc.latitude as number,
        loc.longitude as number
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return withDistance.slice(0, limit);
}

/** Flat rate per kilometer used for delivery fee calculations (Phase 30). */
const DELIVERY_RATE_PER_KM = 0.5;

/**
 * Estimates a delivery fee based on distance from the nearest
 * branch to the customer's delivery address coordinates.
 */
export async function estimateDeliveryFee(
  customerLat: number,
  customerLng: number
): Promise<{ distanceKm: number; fee: number; nearestLocationName: string } | null> {
  const nearest = await findNearestLocations(customerLat, customerLng, 1);

  if (nearest.length === 0) return null;

  const closest = nearest[0];
  const fee = Math.round(closest.distanceKm * DELIVERY_RATE_PER_KM * 100) / 100;

  return { distanceKm: closest.distanceKm, fee, nearestLocationName: closest.name };
}
