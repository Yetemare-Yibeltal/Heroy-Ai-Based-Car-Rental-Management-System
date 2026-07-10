import { Router } from 'express';
import * as locationsController from './locations.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';
import { createLocationSchema, updateLocationSchema } from './locations.validation';

export const locationsRoutes = Router();

locationsRoutes.get('/', catchAsync(locationsController.listLocations));

locationsRoutes.get('/:id', catchAsync(locationsController.getLocationById));

locationsRoutes.post(
  '/',
  authenticate,
  authorize(...ADMIN_ROLES),
  validate(createLocationSchema),
  catchAsync(locationsController.createLocation)
);

locationsRoutes.patch(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  validate(updateLocationSchema),
  catchAsync(locationsController.updateLocation)
);

locationsRoutes.delete(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(locationsController.deleteLocation)
);
