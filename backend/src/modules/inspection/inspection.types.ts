import { InspectionType } from '@prisma/client';

export interface CreateInspectionInput {
  bookingId: string;
  type: InspectionType;
  notes?: string;
  photos: string[];
  damageFound: boolean;
}

export interface InspectionReportOutput {
  id: string;
  bookingId: string;
  vehicleName: string;
  vehiclePlate: string;
  customerName: string;
  type: InspectionType;
  notes: string | null;
  photos: string[];
  damageFound: boolean;
  inspectedBy: string | null;
  createdAt: Date;
}

export interface CompareInspectionsResult {
  bookingId: string;
  pickup: InspectionReportOutput | null;
  return: InspectionReportOutput | null;
  hasNewDamage: boolean;
}
