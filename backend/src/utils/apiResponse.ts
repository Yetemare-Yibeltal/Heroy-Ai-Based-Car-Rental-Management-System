import { Response } from "express";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SuccessResponseBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Sends a standard success response.
 * Example: sendSuccess(res, 200, 'Vehicle created', vehicle)
 */
export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
): Response {
  const body: SuccessResponseBody<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(body);
}

/**
 * Sends a standard success response that includes pagination metadata.
 * Example: sendPaginated(res, 'Vehicles fetched', vehicles, { page, limit, total })
 */
export function sendPaginated<T>(
  res: Response,
  message: string,
  data: T,
  pagination: { page: number; limit: number; total: number },
): Response {
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const body: SuccessResponseBody<T> = {
    success: true,
    message,
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
    },
  };
  return res.status(200).json(body);
}

/**
 * Sends a 204 No Content response for successful deletions.
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
