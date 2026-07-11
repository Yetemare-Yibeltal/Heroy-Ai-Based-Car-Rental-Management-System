import { Router } from 'express';
import * as usersController from './users.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';
import {
  updateProfileSchema,
  adminUpdateUserSchema,
  listUsersQuerySchema,
} from './users.validation';

export const usersRoutes = Router();

usersRoutes.get('/me', authenticate, catchAsync(usersController.getMyProfile));

usersRoutes.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  catchAsync(usersController.updateMyProfile)
);

usersRoutes.delete('/me', authenticate, catchAsync(usersController.deleteMyAccount));

usersRoutes.get(
  '/',
  authenticate,
  authorize(...ADMIN_ROLES),
  validate(listUsersQuerySchema, 'query'),
  catchAsync(usersController.listUsers)
);

usersRoutes.get(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(usersController.getUserById)
);

usersRoutes.patch(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  validate(adminUpdateUserSchema),
  catchAsync(usersController.adminUpdateUser)
);

usersRoutes.delete(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(usersController.adminDeleteUser)
);
