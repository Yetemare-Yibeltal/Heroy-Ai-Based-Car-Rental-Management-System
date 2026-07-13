export interface CreateCorporateAccountInput {
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  billingAddress?: string;
}

export interface UpdateCorporateAccountInput {
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
  billingAddress?: string;
}

export interface AddEmployeeInput {
  userId: string;
}

export interface CorporateAccountOutput {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string | null;
  billingAddress: string | null;
  employeeCount: number;
  createdAt: Date;
}

export interface CorporateEmployeeOutput {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface CorporateBillingSummary {
  corporateAccountId: string;
  companyName: string;
  totalBookings: number;
  totalSpend: number;
  periodStart: Date;
  periodEnd: Date;
  employeeBreakdown: {
    userId: string;
    userName: string;
    bookingCount: number;
    totalSpend: number;
  }[];
}
