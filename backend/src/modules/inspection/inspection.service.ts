import { InspectionType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { createNotification } from '../notifications/notifications.service';
import {
  CreateInspectionInput,
  InspectionReportOutput,
  CompareInspectionsResult,
} from './inspection.types';

function toOutput(report: {
  id: string;
  bookingId: string;
  type: InspectionType;
  notes: string | null;
  photos: string[];
  damageFound: boolean;
  inspectedBy: string | null;
  createdAt: Date;
  booking: {
    vehicle: { name: string; plate: string };
    user: { firstName: string; lastName: string };
  };
}): InspectionReportOutput {
  return {
    id: report.id,
    bookingId: report.bookingId,
    vehicleName: report.booking.vehicle.name,
    vehiclePlate: report.booking.vehicle.plate,
    customerName: `${report.booking.user.firstName} ${report.booking.user.lastName}`,
    type: report.type,
    notes: report.notes,
    photos: report.photos,
    damageFound: report.damageFound,
    inspectedBy: report.inspectedBy,
    createdAt: report.createdAt,
  };
}

const inspectionInclude = {
  booking: {
    select: {
      vehicle: { select: { name: true, plate: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  },
} as const;

export async function createInspection(
  inspectorId: string,
  input: CreateInspectionInput
): Promise<InspectionReportOutput> {
  const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
  if (!booking) {
    throw AppError.notFound('Booking not found.');
  }

  const existing = await prisma.inspectionReport.findFirst({
    where: { bookingId: input.bookingId, type: input.type },
  });
  if (existing) {
    throw AppError.conflict(
      `A ${input.type.toLowerCase()} inspection has already been recorded for this booking.`
    );
  }

  const report = await prisma.inspectionReport.create({
    data: {
      bookingId: input.bookingId,
      type: input.type,
      notes: input.notes,
      photos: input.photos,
      damageFound: input.damageFound,
      inspectedBy: inspectorId,
    },
    include: inspectionInclude,
  });

  if (input.damageFound) {
    await createNotification({
      userId: booking.userId,
      type: 'BOOKING',
      title: `Damage noted at ${input.type.toLowerCase()}`,
      message:
        input.type === 'RETURN'
          ? 'Damage was noted during your vehicle return inspection. Our team will follow up regarding any charges.'
          : 'Damage was noted during your vehicle pickup inspection - this is recorded so you are not held responsible for pre-existing damage.',
    });
  }

  logger.info(
    `Inspection recorded: booking ${input.bookingId}, type ${input.type}, damage: ${input.damageFound}`
  );

  return toOutput(report);
}

export async function getInspectionsForBooking(
  bookingId: string
): Promise<InspectionReportOutput[]> {
  const reports = await prisma.inspectionReport.findMany({
    where: { bookingId },
    include: inspectionInclude,
    orderBy: { createdAt: 'asc' },
  });

  return reports.map(toOutput);
}

/**
 * Compares the pickup and return inspections for a booking to
 * determine whether damage appeared during the rental (i.e. wasn't
 * present at pickup but was found at return) - the key question for
 * deciding whether to charge the customer.
 */
export async function compareInspections(bookingId: string): Promise<CompareInspectionsResult> {
  const reports = await prisma.inspectionReport.findMany({
    where: { bookingId },
    include: inspectionInclude,
    orderBy: { createdAt: 'asc' },
  });

  const pickup = reports.find((r) => r.type === InspectionType.PICKUP);
  const returnReport = reports.find((r) => r.type === InspectionType.RETURN);

  const hasNewDamage = Boolean(returnReport?.damageFound && !pickup?.damageFound);

  return {
    bookingId,
    pickup: pickup ? toOutput(pickup) : null,
    return: returnReport ? toOutput(returnReport) : null,
    hasNewDamage,
  };
}
