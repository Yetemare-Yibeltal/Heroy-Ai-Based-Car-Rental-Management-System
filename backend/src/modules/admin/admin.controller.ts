import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import * as adminService from './admin.service';

export async function getOverview(req: Request, res: Response): Promise<void> {
  const overview = await adminService.getDashboardOverview();
  sendSuccess(res, 200, 'Dashboard overview fetched.', overview);
}

export async function getRevenueByMonth(req: Request, res: Response): Promise<void> {
  const monthsBack = req.query.months ? Number(req.query.months) : 6;
  const revenue = await adminService.getRevenueByMonth(monthsBack);
  sendSuccess(res, 200, 'Revenue by month fetched.', revenue);
}

export async function getBookingsByStatus(req: Request, res: Response): Promise<void> {
  const data = await adminService.getBookingsByStatus();
  sendSuccess(res, 200, 'Bookings by status fetched.', data);
}

export async function getTopVehicles(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const vehicles = await adminService.getTopVehicles(limit);
  sendSuccess(res, 200, 'Top vehicles fetched.', vehicles);
}

export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const activity = await adminService.getRecentActivity(limit);
  sendSuccess(res, 200, 'Recent activity fetched.', activity);
}
