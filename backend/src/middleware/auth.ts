import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

/**
 * Verifies the Authorization header contains a valid access token
 * and attaches the decoded payload to req.user. Throws 401 if
 * missing, malformed, or expired.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('No access token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired access token.');
  }
}

/**
 * Restricts a route to one or more roles. Must be used after
 * `authenticate` so req.user is already populated.
 *
 * Example: router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.remove)
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden('You do not have permission to perform this action.');
    }

    next();
  };
}

/**
 * Like authenticate, but does not throw if no token is present.
 * Used on public routes that behave slightly differently for
 * logged-in users (e.g. showing wishlist state on vehicle listings,
 * or letting the AI assistant recognize a logged-in customer)
 * without requiring login.
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = verifyAccessToken(token);
  } catch {
    // Invalid token on an optional route is treated as "not logged in"
    // rather than an error.
  }

  next();
}
