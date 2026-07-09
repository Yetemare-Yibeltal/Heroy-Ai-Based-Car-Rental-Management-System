import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hashes a plain-text password before storing it in the database.
 * Never store a raw password anywhere.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compares a plain-text password (from a login form) against
 * the hashed password stored in the database.
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Basic password strength check used during registration.
 * Requires at least 8 characters, one uppercase letter, one
 * lowercase letter, and one number.
 */
export function isPasswordStrong(password: string): boolean {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPasswordRegex.test(password);
}
