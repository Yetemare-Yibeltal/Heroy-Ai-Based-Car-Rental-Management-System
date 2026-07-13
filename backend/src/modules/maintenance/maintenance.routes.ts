import { Router } from 'express';
import * as maintenanceController from './maintenance.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { STAFF_ROLES } from '../../constants/enums';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  listMaintenanceQuerySchema,
} from './maintenance.validation';

export const maintenanceRoutes = Router();

maintenanceRoutes.use(authenticate, authorize(...STAFF_ROLES));

maintenanceRoutes.get(
  '/due-for-service',
  catchAsync(maintenanceController.getVehiclesDueForService)
);

maintenanceRoutes.post(
  '/',
  validate(createMaintenanceSchema),
  catchAsync(maintenanceController.createMaintenance)
);

maintenanceRoutes.get(
  '/',
  validate(listMaintenanceQuerySchema, 'query'),
  catchAsync(maintenanceController.listMaintenance)
);

maintenanceRoutes.get('/:id', catchAsync(maintenanceController.getMaintenanceById));

maintenanceRoutes.patch(
  '/:id',
  validate(updateMaintenanceSchema),
  catchAsync(maintenanceController.updateMaintenance)
);

maintenanceRoutes.delete('/:id', catchAsync(maintenanceController.deleteMaintenance));
