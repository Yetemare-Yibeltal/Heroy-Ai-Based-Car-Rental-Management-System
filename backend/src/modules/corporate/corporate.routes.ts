import { Router } from 'express';
import * as corporateController from './corporate.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';
import {
  createCorporateAccountSchema,
  updateCorporateAccountSchema,
  addEmployeeSchema,
  billingSummaryQuerySchema,
} from './corporate.validation';

export const corporateRoutes = Router();

corporateRoutes.use(authenticate, authorize(...ADMIN_ROLES));

corporateRoutes.post(
  '/',
  validate(createCorporateAccountSchema),
  catchAsync(corporateController.createCorporateAccount)
);

corporateRoutes.get('/', catchAsync(corporateController.listCorporateAccounts));

corporateRoutes.get('/:id', catchAsync(corporateController.getCorporateAccountById));

corporateRoutes.patch(
  '/:id',
  validate(updateCorporateAccountSchema),
  catchAsync(corporateController.updateCorporateAccount)
);

corporateRoutes.delete('/:id', catchAsync(corporateController.deleteCorporateAccount));

corporateRoutes.get('/:id/employees', catchAsync(corporateController.listEmployees));

corporateRoutes.post(
  '/:id/employees',
  validate(addEmployeeSchema),
  catchAsync(corporateController.addEmployee)
);

corporateRoutes.delete(
  '/:id/employees/:userId',
  catchAsync(corporateController.removeEmployee)
);

corporateRoutes.get(
  '/:id/billing-summary',
  validate(billingSummaryQuerySchema, 'query'),
  catchAsync(corporateController.getBillingSummary)
);