import { BookingStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  DateRangeQuery,
  RevenueReport,
  RevenueReportRow,
  UtilizationReport,
  UtilizationReportRow,
  BookingExportRow,
} from './reports.types';

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(Math.round(ms / 86400000), 1);
}

export async function generateRevenueReport(query: DateRangeQuery): Promise<RevenueReport> {
  const start = new Date(query.startDate);
  const end = new Date(query.endDate);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: {
        in: [PaymentStatus.PAID, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED],
      },
    },
    select: { amount: true, status: true, createdAt: true, bookingId: true },
  });

  const buckets = new Map<string, RevenueReportRow>();

  let cursor = new Date(start);
  while (cursor <= end) {
    const key = dateKey(cursor);
    buckets.set(key, { date: key, bookingCount: 0, revenue: 0, refunds: 0, netRevenue: 0 });
    cursor = new Date(cursor.getTime() + 86400000);
  }

  for (const payment of payments) {
    const key = dateKey(payment.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;

    bucket.bookingCount += 1;
    if (payment.status === PaymentStatus.PAID) {
      bucket.revenue += payment.amount;
    } else {
      bucket.refunds += payment.amount;
    }
    bucket.netRevenue = Math.round((bucket.revenue - bucket.refunds) * 100) / 100;
  }

  const rows = Array.from(buckets.values());
  const totalRevenue = Math.round(rows.reduce((sum, r) => sum + r.revenue, 0) * 100) / 100;
  const totalRefunds = Math.round(rows.reduce((sum, r) => sum + r.refunds, 0) * 100) / 100;

  return {
    periodStart: start,
    periodEnd: end,
    totalRevenue,
    totalRefunds,
    netRevenue: Math.round((totalRevenue - totalRefunds) * 100) / 100,
    totalBookings: rows.reduce((sum, r) => sum + r.bookingCount, 0),
    rows,
  };
}

export async function generateUtilizationReport(query: DateRangeQuery): Promise<UtilizationReport> {
  const start = new Date(query.startDate);
  const end = new Date(query.endDate);
  const totalPeriodDays = daysBetween(start, end);

  const vehicles = await prisma.vehicle.findMany({
    include: {
      bookings: {
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.COMPLETED] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      },
    },
  });

  const rows: UtilizationReportRow[] = vehicles.map((vehicle) => {
    let totalDaysRented = 0;
    let revenue = 0;

    for (const booking of vehicle.bookings) {
      const bookingStart = booking.startDate < start ? start : booking.startDate;
      const bookingEnd = booking.endDate > end ? end : booking.endDate;
      totalDaysRented += daysBetween(bookingStart, bookingEnd);
      revenue += booking.totalPrice;
    }

    const utilizationRate = Math.min(Math.round((totalDaysRented / totalPeriodDays) * 100), 100);

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      vehiclePlate: vehicle.plate,
      category: vehicle.category,
      totalBookings: vehicle.bookings.length,
      totalDaysRented,
      utilizationRate,
      revenue: Math.round(revenue * 100) / 100,
    };
  });

  const averageUtilizationRate =
    rows.length > 0
      ? Math.round(rows.reduce((sum, r) => sum + r.utilizationRate, 0) / rows.length)
      : 0;

  return {
    periodStart: start,
    periodEnd: end,
    fleetSize: vehicles.length,
    averageUtilizationRate,
    rows,
  };
}

export async function generateBookingExport(query: DateRangeQuery): Promise<BookingExportRow[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: new Date(query.startDate), lte: new Date(query.endDate) },
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      vehicle: { select: { name: true, plate: true } },
      payment: { select: { status: true, provider: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings.map((b) => ({
    bookingId: b.id,
    customerName: `${b.user.firstName} ${b.user.lastName}`,
    customerEmail: b.user.email,
    vehicleName: b.vehicle.name,
    vehiclePlate: b.vehicle.plate,
    startDate: b.startDate.toISOString().slice(0, 10),
    endDate: b.endDate.toISOString().slice(0, 10),
    status: b.status,
    totalPrice: b.totalPrice,
    paymentStatus: b.payment?.status ?? 'NONE',
    paymentProvider: b.payment?.provider ?? 'NONE',
  }));
}
