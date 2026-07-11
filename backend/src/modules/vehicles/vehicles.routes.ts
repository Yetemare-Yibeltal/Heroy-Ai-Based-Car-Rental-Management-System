import { Router } from 'express';
import * as vehiclesController from './vehicles.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';
import {
  createVehicleSchema,
  updateVehicleSchema,
  listVehiclesQuerySchema,
  addVehicleImageSchema,
} from './vehicles.validation';

export const vehiclesRoutes = Router();

vehiclesRoutes.get(
  '/',
  validate(listVehiclesQuerySchema, 'query'),
  catchAsync(vehiclesController.listVehicles)
);

vehiclesRoutes.get('/:id', catchAsync(vehiclesController.getVehicleById));

vehiclesRoutes.post(
  '/',
  authenticate,
  authorize(...ADMIN_ROLES),
  validate(createVehicleSchema),
  catchAsync(vehiclesController.createVehicle)
);

vehiclesRoutes.patch(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  validate(updateVehicleSchema),
  catchAsync(vehiclesController.updateVehicle)
);

vehiclesRoutes.delete(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(vehiclesController.deleteVehicle)
);

vehiclesRoutes.post(
  '/:id/images',
  authenticate,
  authorize(...ADMIN_ROLES),
  validate(addVehicleImageSchema),
  catchAsync(vehiclesController.addVehicleImage)
);

vehiclesRoutes.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(vehiclesController.removeVehicleImage)
);
