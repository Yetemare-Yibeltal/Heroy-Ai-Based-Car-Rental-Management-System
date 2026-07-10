import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { generateTablePdf } from '../../utils/export.util';
import { logger } from '../../utils/logger';

interface InvoiceData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  vehicleName: string;
  vehiclePlate: string;
  startDate: Date;
  endDate: Date;
  days: number;
  pricePerDay: number;
  insuranceAddOn: boolean;
  deliveryRequested: boolean;
  totalPrice: number;
  paymentMethod: string;
  paymentProvider: string;
  paidAt: Date;
}

async function getInvoiceData(bookingId: string): Promise<InvoiceData> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, vehicle: true, payment: true },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found.');
  }
  if (!booking.payment || booking.payment.status !== 'PAID') {
    throw AppError.badRequest('This booking has not been paid for yet.');
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.max(
    Math.round((booking.endDate.getTime() - booking.startDate.getTime()) / msPerDay),
    1
  );

  return {
    bookingId: booking.id,
    customerName: `${booking.user.firstName} ${booking.user.lastName}`,
    customerEmail: booking.user.email,
    vehicleName: `${booking.vehicle.brand} ${booking.vehicle.name}`,
    vehiclePlate: booking.vehicle.plate,
    startDate: booking.startDate,
    endDate: booking.endDate,
    days,
    pricePerDay: booking.vehicle.pricePerDay,
    insuranceAddOn: booking.insuranceAddOn,
    deliveryRequested: booking.deliveryRequested,
    totalPrice: booking.totalPrice,
    paymentMethod: booking.payment.method,
    paymentProvider: booking.payment.provider,
    paidAt: booking.payment.createdAt,
  };
}

/**
 * Builds a one-page PDF invoice for a completed, paid booking and
 * returns it as a Buffer - ready to stream to the client or upload
 * to storage.
 */
export async function generateInvoicePdf(bookingId: string): Promise<Buffer> {
  const data = await getInvoiceData(bookingId);

  const rows = [
    {
      item: `${data.vehicleName} (${data.vehiclePlate})`,
      detail: `${data.days} day(s)`,
      amount: `$${(data.pricePerDay * data.days).toFixed(2)}`,
    },
    ...(data.insuranceAddOn
      ? [
          {
            item: 'Insurance add-on',
            detail: `${data.days} day(s)`,
            amount: '$' + (8 * data.days).toFixed(2),
          },
        ]
      : []),
    ...(data.deliveryRequested
      ? [{ item: 'Vehicle delivery', detail: '-', amount: '$15.00' }]
      : []),
  ];

  const buffer = await generateTablePdf({
    title: 'HEROY Car Rental - Invoice',
    subtitle: `Booking #${data.bookingId} | Paid on ${data.paidAt.toDateString()}`,
    columns: [
      { header: 'Item', key: 'item', width: 260 },
      { header: 'Detail', key: 'detail', width: 140 },
      { header: 'Amount', key: 'amount', width: 100 },
    ],
    rows: [
      ...rows,
      {
        item: 'Total paid',
        detail: `via ${data.paymentProvider} (${data.paymentMethod})`,
        amount: `$${data.totalPrice.toFixed(2)}`,
      },
    ],
  });

  logger.info(`Invoice generated for booking ${bookingId}`);

  return buffer;
}
