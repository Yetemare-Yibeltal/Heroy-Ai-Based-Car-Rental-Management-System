import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';

export const adminRoutes = Router();

adminRoutes.use(authenticate, authorize(...ADMIN_ROLES));

adminRoutes.get('/overview', catchAsync(adminController.getOverview));

adminRoutes.get('/revenue-by-month', catchAsync(adminController.getRevenueByMonth));

adminRoutes.get('/bookings-by-status', catchAsync(adminController.getBookingsByStatus));

adminRoutes.get('/top-vehicles', catchAsync(adminController.getTopVehicles));

adminRoutes.get('/recent-activity', catchAsync(adminController.getRecentActivity));
