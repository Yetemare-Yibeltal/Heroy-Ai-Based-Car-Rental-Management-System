import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { sendCSV, generateTablePdf } from '../../utils/export.util';
import * as reportsService from './reports.service';
import { DateRangeQuery } from './reports.types';

function getDateRange(req: Request): DateRangeQuery {
  const startDate = String(
    req.query.startDate ?? new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
  );
  const endDate = String(req.query.endDate ?? new Date().toISOString());
  return { startDate, endDate };
}

export async function getRevenueReport(req: Request, res: Response): Promise<void> {
  const report = await reportsService.generateRevenueReport(getDateRange(req));
  sendSuccess(res, 200, 'Revenue report generated.', report);
}

export async function getUtilizationReport(req: Request, res: Response): Promise<void> {
  const report = await reportsService.generateUtilizationReport(getDateRange(req));
  sendSuccess(res, 200, 'Utilization report generated.', report);
}

export async function getBookingExportJson(req: Request, res: Response): Promise<void> {
  const rows = await reportsService.generateBookingExport(getDateRange(req));
  sendSuccess(res, 200, 'Booking export generated.', rows);
}

export async function downloadBookingExportCsv(req: Request, res: Response): Promise<void> {
  const rows = await reportsService.generateBookingExport(getDateRange(req));
  sendCSV(res, `heroy-bookings-${Date.now()}.csv`, rows as unknown as Record<string, unknown>[]);
}

export async function downloadRevenueReportPdf(req: Request, res: Response): Promise<void> {
  const report = await reportsService.generateRevenueReport(getDateRange(req));

  const pdfBuffer = await generateTablePdf({
    title: 'HEROY Revenue Report',
    subtitle: `${report.periodStart.toDateString()} - ${report.periodEnd.toDateString()} | Net revenue: $${report.netRevenue.toFixed(2)}`,
    columns: [
      { header: 'Date', key: 'date', width: 100 },
      { header: 'Bookings', key: 'bookingCount', width: 80 },
      { header: 'Revenue', key: 'revenue', width: 100 },
      { header: 'Refunds', key: 'refunds', width: 100 },
      { header: 'Net', key: 'netRevenue', width: 100 },
    ],
    rows: report.rows as unknown as Record<string, unknown>[],
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="heroy-revenue-report-${Date.now()}.pdf"`
  );
  res.status(200).send(pdfBuffer);
}
