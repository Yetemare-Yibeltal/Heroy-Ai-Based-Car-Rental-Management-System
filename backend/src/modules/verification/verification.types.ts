import { VerificationStatus } from '@prisma/client';

export type DocumentType = 'DRIVERS_LICENSE' | 'NATIONAL_ID' | 'PASSPORT';

export interface SubmitVerificationInput {
  documentType: DocumentType;
  documentUrl: string;
}

export interface ReviewVerificationInput {
  status: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
}

export interface VerificationDocumentOutput {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: string;
  documentUrl: string;
  status: VerificationStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface ListVerificationsQuery {
  page: number;
  limit: number;
  status?: VerificationStatus;
}