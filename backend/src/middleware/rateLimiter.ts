import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/**
 * General-purpose limiter applied to the whole API.
 * Configurable via RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX_REQUESTS.
 */
export const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },
});

/**
 * Strict limiter for auth endpoints (login, register, password reset)
 * to slow down brute-force and credential-stuffing attempts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again in 15 minutes.",
  },
});

/**
 * Limiter for the AI assistant endpoint, since each request calls
 * the paid Claude API. Prevents a single user (or bot) from running
 * up API costs.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI assistant requests. Please slow down.",
  },
});

/**
 * Limiter for payment-related endpoints (checkout, webhook retries)
 * to add a layer of protection around financial operations.
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many payment requests. Please try again shortly.",
  },
});
