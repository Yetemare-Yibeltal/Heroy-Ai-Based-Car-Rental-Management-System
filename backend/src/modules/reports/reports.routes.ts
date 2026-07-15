import { Router } from 'express';
import * as reportsController from './reports.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';

export const reportsRoutes = Router();

reportsRoutes.use(authenticate, authorize(...ADMIN_ROLES));

reportsRoutes.get('/revenue', catchAsync(reportsController.getRevenueReport));

reportsRoutes.get('/revenue/pdf', catchAsync(reportsController.downloadRevenueReportPdf));

reportsRoutes.get('/utilization', catchAsync(reportsController.getUtilizationReport));

reportsRoutes.get('/bookings', catchAsync(reportsController.getBookingExportJson));

reportsRoutes.get('/bookings/csv', catchAsync(reportsController.downloadBookingExportCsv));
