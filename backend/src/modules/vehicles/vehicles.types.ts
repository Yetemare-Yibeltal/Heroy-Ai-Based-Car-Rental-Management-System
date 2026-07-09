import { VehicleCategory, VehicleStatus, TransmissionType, FuelType } from '@prisma/client';

export interface VehicleImageInput {
  url: string;
  isPrimary?: boolean;
}

export interface CreateVehicleInput {
  name: string;
  brand: string;
  category: VehicleCategory;
  transmission: TransmissionType;
  fuel: FuelType;
  seats: number;
  pricePerDay: number;
  plate: string;
  description?: string;
  mileage?: number;
  year: number;
  locationId?: string;
  images?: VehicleImageInput[];
}

export interface UpdateVehicleInput {
  name?: string;
  brand?: string;
  category?: VehicleCategory;
  transmission?: TransmissionType;
  fuel?: FuelType;
  seats?: number;
  pricePerDay?: number;
  description?: string;
  mileage?: number;
  year?: number;
  status?: VehicleStatus;
  locationId?: string;
}

export interface VehicleImageOutput {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface VehicleOutput {
  id: string;
  name: string;
  brand: string;
  category: VehicleCategory;
  transmission: TransmissionType;
  fuel: FuelType;
  seats: number;
  pricePerDay: number;
  status: VehicleStatus;
  plate: string;
  description: string | null;
  mileage: number;
  year: number;
  locationId: string | null;
  locationName: string | null;
  images: VehicleImageOutput[];
  averageRating: number | null;
  reviewCount: number;
  createdAt: Date;
}

export interface ListVehiclesQuery {
  page: number;
  limit: number;
  category?: VehicleCategory;
  status?: VehicleStatus;
  transmission?: TransmissionType;
  fuel?: FuelType;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  locationId?: string;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
  startDate?: string;
  endDate?: string;
}

export interface ListVehiclesResult {
  vehicles: VehicleOutput[];
  total: number;
}
