import { Prisma, MaintenanceStatus, VehicleStatus, BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import {
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
  MaintenanceRecordOutput,
  ListMaintenanceQuery,
} from './maintenance.types';

function toOutput(record: {
  id: string;
  vehicleId: string;
  vehicle: { name: string; plate: string };
  status: MaintenanceStatus;
  description: string;
  scheduledDate: Date;
  completedDate: Date | null;
  odometerAtService: number | null;
  cost: number | null;
  createdAt: Date;
}): MaintenanceRecordOutput {
  return {
    id: record.id,
    vehicleId: record.vehicleId,
    vehicleName: record.vehicle.name,
    vehiclePlate: record.vehicle.plate,
    status: record.status,
    description: record.description,
    scheduledDate: record.scheduledDate,
    completedDate: record.completedDate,
    odometerAtService: record.odometerAtService,
    cost: record.cost,
    createdAt: record.createdAt,
  };
}

const maintenanceInclude = {
  vehicle: { select: { name: true, plate: true } },
} as const;

export async function createMaintenance(
  input: CreateMaintenanceInput
): Promise<MaintenanceRecordOutput> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw AppError.notFound('Vehicle not found.');
  }

  const activeBookings = await prisma.booking.count({
    where: {
      vehicleId: input.vehicleId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
      startDate: { lte: new Date(input.scheduledDate) },
    },
  });

  if (activeBookings > 0) {
    throw AppError.conflict(
      'This vehicle has an active or upcoming booking overlapping the scheduled maintenance date. Reschedule the maintenance or wait until the booking completes.'
    );
  }

  const record = await prisma.maintenanceRecord.create({
    data: {
      vehicleId: input.vehicleId,
      description: input.description,
      scheduledDate: new Date(input.scheduledDate),
      status: MaintenanceStatus.SCHEDULED,
    },
    include: maintenanceInclude,
  });

  logger.info(`Maintenance scheduled for vehicle ${vehicle.plate}: ${input.description}`);

  return toOutput(record);
}

export async function updateMaintenance(
  recordId: string,
  input: UpdateMaintenanceInput
): Promise<MaintenanceRecordOutput> {
  const existing = await prisma.maintenanceRecord.findUnique({
    where: { id: recordId },
    include: { vehicle: true },
  });
  if (!existing) {
    throw AppError.notFound('Maintenance record not found.');
  }

  const record = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRecord.update({
      where: { id: recordId },
      data: {
        status: input.status,
        description: input.description,
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
        completedDate: input.completedDate ? new Date(input.completedDate) : undefined,
        odometerAtService: input.odometerAtService,
        cost: input.cost,
      },
      include: maintenanceInclude,
    });

    // Keep the vehicle's own status in sync with maintenance state -
    // this is what actually removes it from the bookable fleet.
    if (input.status === MaintenanceStatus.IN_PROGRESS) {
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: VehicleStatus.MAINTENANCE },
      });
    } else if (input.status === MaintenanceStatus.COMPLETED) {
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: {
          status: VehicleStatus.AVAILABLE,
          mileage: input.odometerAtService ?? existing.vehicle.mileage,
        },
      });
    }

    return updated;
  });

  logger.info(
    `Maintenance record ${recordId} updated: ${existing.status} -> ${input.status ?? existing.status}`
  );

  return toOutput(record);
}

export async function getMaintenanceById(recordId: string): Promise<MaintenanceRecordOutput> {
  const record = await prisma.maintenanceRecord.findUnique({
    where: { id: recordId },
    include: maintenanceInclude,
  });

  if (!record) {
    throw AppError.notFound('Maintenance record not found.');
  }

  return toOutput(record);
}

export async function listMaintenance(query: ListMaintenanceQuery) {
  const where: Prisma.MaintenanceRecordWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.vehicleId) where.vehicleId = query.vehicleId;

  const [records, total] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      where,
      include: maintenanceInclude,
      orderBy: { scheduledDate: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.maintenanceRecord.count({ where }),
  ]);

  return { records: records.map(toOutput), total };
}

export async function deleteMaintenance(recordId: string): Promise<void> {
  const existing = await prisma.maintenanceRecord.findUnique({ where: { id: recordId } });
  if (!existing) {
    throw AppError.notFound('Maintenance record not found.');
  }

  if (existing.status === MaintenanceStatus.IN_PROGRESS) {
    throw AppError.conflict(
      'Cannot delete a maintenance record that is currently in progress. Mark it completed first.'
    );
  }

  await prisma.maintenanceRecord.delete({ where: { id: recordId } });
  logger.info(`Maintenance record ${recordId} deleted.`);
}

/**
 * Returns vehicles whose mileage-based service interval has been
 * exceeded (every 8,000 units) and have no currently scheduled or
 * in-progress maintenance record. Used to power a "vehicles due for
 * service" alert on the admin maintenance dashboard.
 */
export async function getVehiclesDueForService() {
  const SERVICE_INTERVAL = 8000;

  const vehicles = await prisma.vehicle.findMany({
    include: {
      maintenanceRecords: {
        where: { status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] } },
      },
    },
  });

  return vehicles
    .filter(
      (v) =>
        v.mileage > 0 && v.mileage % SERVICE_INTERVAL < 500 && v.maintenanceRecords.length === 0
    )
    .map((v) => ({ id: v.id, name: v.name, plate: v.plate, mileage: v.mileage }));
}
