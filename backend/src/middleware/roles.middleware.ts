import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';

/**
 * Defines the real organizational hierarchy - each role's numeric
 * level determines what it can do relative to other roles. Higher
 * numbers can act on anything a lower number can, but not vice versa.
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  CUSTOMER: 0,
  STAFF: 1,
  BRANCH_MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Restricts a route to a minimum role level rather than an explicit
 * list - e.g. requireMinimumRole('BRANCH_MANAGER') allows
 * BRANCH_MANAGER, ADMIN, and SUPER_ADMIN, but not STAFF or CUSTOMER.
 * This scales better than authorize() as the role hierarchy grows.
 */
export function requireMinimumRole(minimumRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required.');
    }

    const userLevel = ROLE_HIERARCHY[req.user.role as Role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      throw AppError.forbidden(`This action requires at least ${minimumRole} privileges.`);
    }

    next();
  };
}

/**
 * Prevents a role from acting on a user of equal or higher rank -
 * e.g. a BRANCH_MANAGER should not be able to modify an ADMIN's
 * account, even if both technically pass a basic role check.
 * Used in the users module for role-change protection.
 */
export function assertCanActOnRole(actingRole: Role, targetRole: Role): void {
  const actingLevel = ROLE_HIERARCHY[actingRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];

  if (actingLevel <= targetLevel && actingRole !== 'SUPER_ADMIN') {
    throw AppError.forbidden(
      'You do not have sufficient privileges to act on a user of this rank.'
    );
  }
}

/** Actions considered sensitive enough to always appear in the audit log. */
export const SENSITIVE_ACTIONS = [
  'USER_ROLE_CHANGED',
  'USER_DELETED',
  'PAYMENT_REFUNDED',
  'BOOKING_CANCELLED_BY_STAFF',
  'COUPON_CREATED',
  'VEHICLE_DELETED',
  'VERIFICATION_REVIEWED',
  'CORPORATE_ACCOUNT_DELETED',
] as const;

export type SensitiveAction = (typeof SENSITIVE_ACTIONS)[number];

export function isSensitiveAction(action: string): action is SensitiveAction {
  return (SENSITIVE_ACTIONS as readonly string[]).includes(action);
}
