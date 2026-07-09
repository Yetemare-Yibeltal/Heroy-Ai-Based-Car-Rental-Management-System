import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "../utils/AppError";

type RequestPart = "body" | "query" | "params";

function formatZodError(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "value";
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }
  return errors;
}

/**
 * Validates req.body (or req.query / req.params) against a Zod
 * schema. On success, replaces the request part with the parsed
 * (and type-coerced) data. On failure, throws a 422 AppError with
 * field-level messages.
 *
 * Example:
 *   router.post('/', validate(createVehicleSchema), controller.create)
 *   router.get('/', validate(listVehiclesQuerySchema, 'query'), controller.list)
 */
export function validate(schema: AnyZodObject, part: RequestPart = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      req[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw AppError.unprocessable("Validation failed.", formatZodError(err));
      }
      throw err;
    }
  };
}
