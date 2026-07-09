import { Role, VerificationStatus } from '@prisma/client';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  verificationStatus: VerificationStatus;
  loyaltyPoints: number;
  corporateAccountId: string | null;
  createdAt: Date;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AdminUpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: Role;
  verificationStatus?: VerificationStatus;
}

export interface ListUsersQuery {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
}

export interface ListUsersResult {
  users: PublicUser[];
  total: number;
}
