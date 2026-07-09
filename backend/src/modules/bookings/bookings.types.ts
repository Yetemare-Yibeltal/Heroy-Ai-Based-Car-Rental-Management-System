import { BookingStatus } from '@prisma/client';

export interface CreateBookingInput {
  vehicleId: string;
  locationId?: string;
  startDate: string;
  endDate: string;
  insuranceAddOn?: boolean;
  deliveryRequested?: boolean;
  deliveryAddress?: string;
  couponCode?: string;
}

export interface UpdateBookingStatusInput {
  status: BookingStatus;
}

export interface BookingVehicleSummary {
  id: string;
  name: string;
  brand: string;
  plate: string;
  pricePerDay: number;
  primaryImageUrl: string | null;
}

export interface BookingUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface BookingOutput {
  id: string;
  userId: string;
  user: BookingUserSummary;
  vehicleId: string;
  vehicle: BookingVehicleSummary;
  locationId: string | null;
  locationName: string | null;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: BookingStatus;
  couponCode: string | null;
  insuranceAddOn: boolean;
  deliveryRequested: boolean;
  deliveryAddress: string | null;
  paymentStatus: string | null;
  createdAt: Date;
}

export interface ListBookingsQuery {
  page: number;
  limit: number;
  status?: BookingStatus;
  userId?: string;
  vehicleId?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export interface ListBookingsResult {
  bookings: BookingOutput[];
  total: number;
}

export interface PriceBreakdown {
  days: number;
  pricePerDay: number;
  subtotal: number;
  insuranceCost: number;
  deliveryCost: number;
  discount: number;
  total: number;
}
