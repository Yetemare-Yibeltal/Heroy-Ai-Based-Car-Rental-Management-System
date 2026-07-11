import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so that any rejected promise (thrown
 * error) is passed to next(), reaching our global error handler
 * instead of crashing the request or the process.
 *
 * Example: router.post('/', catchAsync(controller.create))
 */
export function catchAsync(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
