export {
  Role,
  VehicleCategory,
  VehicleStatus,
  TransmissionType,
  FuelType,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  VerificationStatus,
  NotificationType,
  InspectionType,
  CouponType,
  MaintenanceStatus,
  AIRole,
} from '@prisma/client';

/** Roles allowed to access the staff/admin console. */
export const STAFF_ROLES = ['STAFF', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'] as const;

/** Roles allowed to manage fleet, pricing, and other admin-only operations. */
export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

/** Default pagination values used across list endpoints. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Minimum age (in years) a customer must be to legally rent a vehicle. */
export const MINIMUM_RENTAL_AGE = 21;

/** Late return grace period, in minutes, before a booking is flagged overdue. */
export const LATE_RETURN_GRACE_MINUTES = 30;
