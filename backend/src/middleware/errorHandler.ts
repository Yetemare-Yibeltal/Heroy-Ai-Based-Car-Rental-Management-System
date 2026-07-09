import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { env } from "../config/env";

interface ErrorResponseBody {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
): AppError {
  switch (err.code) {
    case "P2002": {
      const target =
        (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return AppError.conflict(`A record with this ${target} already exists.`);
    }
    case "P2025":
      return AppError.notFound("The requested record was not found.");
    case "P2003":
      return AppError.badRequest(
        "This action references a record that does not exist.",
      );
    default:
      return AppError.internal("A database error occurred.");
  }
}

function handleZodError(err: ZodError): AppError {
  const errors: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "value";
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }
  return AppError.unprocessable("Validation failed.", errors);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ZodError) {
    appError = handleZodError(err);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(err);
  } else if (err instanceof Error) {
    appError = AppError.internal(
      env.isDevelopment ? err.message : "Something went wrong.",
    );
  } else {
    appError = AppError.internal("An unknown error occurred.");
  }

  if (!appError.isOperational || appError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${appError.message}`, {
      stack: err instanceof Error ? err.stack : undefined,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${appError.message}`);
  }

  const body: ErrorResponseBody = {
    success: false,
    message: appError.message,
  };

  if (appError.errors) {
    body.errors = appError.errors;
  }

  if (env.isDevelopment && err instanceof Error) {
    body.stack = err.stack;
  }

  res.status(appError.statusCode).json(body);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}
