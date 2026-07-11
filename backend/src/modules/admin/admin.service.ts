import { BookingStatus, PaymentStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export interface DashboardOverview {
  totalRevenue: number;
  totalBookings: number;
  activeRentals: number;
  totalVehicles: number;
  availableVehicles: number;
  utilizationRate: number;
  totalCustomers: number;
  pendingBookings: number;
  averageBookingValue: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface BookingsByStatus {
  status: BookingStatus;
  count: number;
}

export interface TopVehicle {
  vehicleId: string;
  name: string;
  brand: string;
  totalRevenue: number;
  bookingCount: number;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [
    revenueAgg,
    totalBookings,
    activeRentals,
    totalVehicles,
    availableVehicles,
    totalCustomers,
    pendingBookings,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { amount: true },
      _avg: { amount: true },
    }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.ACTIVE } }),
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
  ]);

  const utilizationRate =
    totalVehicles > 0 ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100) : 0;

  return {
    totalRevenue: revenueAgg._sum.amount ?? 0,
    totalBookings,
    activeRentals,
    totalVehicles,
    availableVehicles,
    utilizationRate,
    totalCustomers,
    pendingBookings,
    averageBookingValue: Math.round((revenueAgg._avg.amount ?? 0) * 100) / 100,
  };
}

export async function getRevenueByMonth(monthsBack: number = 6): Promise<RevenueByMonth[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: { status: PaymentStatus.PAID, createdAt: { gte: since } },
    select: { amount: true, createdAt: true },
  });

  const buckets = new Map<string, number>();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    buckets.set(key, 0);
  }

  for (const payment of payments) {
    const key = payment.createdAt.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + payment.amount);
    }
  }

  return Array.from(buckets.entries()).map(([month, revenue]) => ({
    month,
    revenue: Math.round(revenue * 100) / 100,
  }));
}

export async function getBookingsByStatus(): Promise<BookingsByStatus[]> {
  const statuses: BookingStatus[] = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

  const counts = await Promise.all(
    statuses.map((status) => prisma.booking.count({ where: { status } }))
  );

  return statuses.map((status, i) => ({ status, count: counts[i] }));
}

export async function getTopVehicles(limit: number = 5): Promise<TopVehicle[]> {
  const bookings = await prisma.booking.findMany({
    where: { status: { in: ['COMPLETED', 'ACTIVE', 'CONFIRMED'] } },
    select: { vehicleId: true, totalPrice: true, vehicle: { select: { name: true, brand: true } } },
  });

  const grouped = new Map<
    string,
    { name: string; brand: string; revenue: number; count: number }
  >();

  for (const booking of bookings) {
    const existing = grouped.get(booking.vehicleId);
    if (existing) {
      existing.revenue += booking.totalPrice;
      existing.count += 1;
    } else {
      grouped.set(booking.vehicleId, {
        name: booking.vehicle.name,
        brand: booking.vehicle.brand,
        revenue: booking.totalPrice,
        count: 1,
      });
    }
  }

  return Array.from(grouped.entries())
    .map(([vehicleId, data]) => ({
      vehicleId,
      name: data.name,
      brand: data.brand,
      totalRevenue: Math.round(data.revenue * 100) / 100,
      bookingCount: data.count,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}

export async function getRecentActivity(limit: number = 10) {
  const recentBookings = await prisma.booking.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      totalPrice: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true } },
      vehicle: { select: { name: true } },
    },
  });

  return recentBookings.map((b) => ({
    bookingId: b.id,
    customerName: `${b.user.firstName} ${b.user.lastName}`,
    vehicleName: b.vehicle.name,
    status: b.status,
    amount: b.totalPrice,
    createdAt: b.createdAt,
  }));
}
