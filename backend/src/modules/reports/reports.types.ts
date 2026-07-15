export interface DateRangeQuery {
  startDate: string;
  endDate: string;
}

export interface RevenueReportRow {
  date: string;
  bookingCount: number;
  revenue: number;
  refunds: number;
  netRevenue: number;
}

export interface RevenueReport {
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  totalBookings: number;
  rows: RevenueReportRow[];
}

export interface UtilizationReportRow {
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  category: string;
  totalBookings: number;
  totalDaysRented: number;
  utilizationRate: number;
  revenue: number;
}

export interface UtilizationReport {
  periodStart: Date;
  periodEnd: Date;
  fleetSize: number;
  averageUtilizationRate: number;
  rows: UtilizationReportRow[];
}

export interface BookingExportRow {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  vehicleName: string;
  vehiclePlate: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  paymentStatus: string;
  paymentProvider: string;
}
