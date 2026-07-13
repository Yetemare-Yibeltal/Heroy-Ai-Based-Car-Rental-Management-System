import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import {
  CreateCorporateAccountInput,
  UpdateCorporateAccountInput,
  CorporateAccountOutput,
  CorporateEmployeeOutput,
  CorporateBillingSummary,
} from './corporate.types';

function toAccountOutput(account: {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string | null;
  billingAddress: string | null;
  createdAt: Date;
  _count: { employees: number };
}): CorporateAccountOutput {
  return {
    id: account.id,
    companyName: account.companyName,
    contactEmail: account.contactEmail,
    contactPhone: account.contactPhone,
    billingAddress: account.billingAddress,
    employeeCount: account._count.employees,
    createdAt: account.createdAt,
  };
}

export async function createCorporateAccount(
  input: CreateCorporateAccountInput
): Promise<CorporateAccountOutput> {
  const account = await prisma.corporateAccount.create({
    data: {
      companyName: input.companyName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      billingAddress: input.billingAddress,
    },
    include: { _count: { select: { employees: true } } },
  });

  logger.info(`Corporate account created: ${account.companyName}`);

  return toAccountOutput(account);
}

export async function updateCorporateAccount(
  accountId: string,
  input: UpdateCorporateAccountInput
): Promise<CorporateAccountOutput> {
  const existing = await prisma.corporateAccount.findUnique({ where: { id: accountId } });
  if (!existing) {
    throw AppError.notFound('Corporate account not found.');
  }

  const account = await prisma.corporateAccount.update({
    where: { id: accountId },
    data: {
      companyName: input.companyName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      billingAddress: input.billingAddress,
    },
    include: { _count: { select: { employees: true } } },
  });

  logger.info(`Corporate account updated: ${account.companyName}`);

  return toAccountOutput(account);
}

export async function getCorporateAccountById(accountId: string): Promise<CorporateAccountOutput> {
  const account = await prisma.corporateAccount.findUnique({
    where: { id: accountId },
    include: { _count: { select: { employees: true } } },
  });

  if (!account) {
    throw AppError.notFound('Corporate account not found.');
  }

  return toAccountOutput(account);
}

export async function listCorporateAccounts(): Promise<CorporateAccountOutput[]> {
  const accounts = await prisma.corporateAccount.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return accounts.map(toAccountOutput);
}

export async function addEmployee(
  accountId: string,
  userId: string
): Promise<CorporateEmployeeOutput> {
  const account = await prisma.corporateAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    throw AppError.notFound('Corporate account not found.');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  if (user.corporateAccountId) {
    throw AppError.conflict('This user is already linked to a corporate account.');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { corporateAccountId: accountId },
  });

  logger.info(`User ${userId} added as employee to corporate account ${account.companyName}`);

  return {
    id: updated.id,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
    role: updated.role,
  };
}

export async function removeEmployee(accountId: string, userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.corporateAccountId !== accountId) {
    throw AppError.notFound('This user is not linked to this corporate account.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { corporateAccountId: null },
  });

  logger.info(`User ${userId} removed from corporate account ${accountId}`);
}

export async function listEmployees(accountId: string): Promise<CorporateEmployeeOutput[]> {
  const account = await prisma.corporateAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    throw AppError.notFound('Corporate account not found.');
  }

  const employees = await prisma.user.findMany({
    where: { corporateAccountId: accountId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });

  return employees;
}

/**
 * Builds a consolidated billing summary across every employee of a
 * corporate account for a given date range - the real report a
 * company's finance team would use to reconcile a monthly invoice.
 */
export async function getBillingSummary(
  accountId: string,
  periodStart?: string,
  periodEnd?: string
): Promise<CorporateBillingSummary> {
  const account = await prisma.corporateAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    throw AppError.notFound('Corporate account not found.');
  }

  const start = periodStart
    ? new Date(periodStart)
    : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = periodEnd ? new Date(periodEnd) : new Date();

  const employees = await prisma.user.findMany({
    where: { corporateAccountId: accountId },
    select: { id: true, firstName: true, lastName: true },
  });

  const employeeIds = employees.map((e) => e.id);

  const bookings = await prisma.booking.findMany({
    where: {
      userId: { in: employeeIds },
      createdAt: { gte: start, lte: end },
      status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
    },
    select: { userId: true, totalPrice: true },
  });

  const employeeBreakdown = employees.map((employee) => {
    const employeeBookings = bookings.filter((b) => b.userId === employee.id);
    return {
      userId: employee.id,
      userName: `${employee.firstName} ${employee.lastName}`,
      bookingCount: employeeBookings.length,
      totalSpend:
        Math.round(employeeBookings.reduce((sum, b) => sum + b.totalPrice, 0) * 100) / 100,
    };
  });

  return {
    corporateAccountId: accountId,
    companyName: account.companyName,
    totalBookings: bookings.length,
    totalSpend: Math.round(bookings.reduce((sum, b) => sum + b.totalPrice, 0) * 100) / 100,
    periodStart: start,
    periodEnd: end,
    employeeBreakdown,
  };
}

export async function deleteCorporateAccount(accountId: string): Promise<void> {
  const existing = await prisma.corporateAccount.findUnique({
    where: { id: accountId },
    include: { _count: { select: { employees: true } } },
  });

  if (!existing) {
    throw AppError.notFound('Corporate account not found.');
  }

  if (existing._count.employees > 0) {
    throw AppError.conflict(
      'This corporate account still has linked employees. Remove them before deleting the account.'
    );
  }

  await prisma.corporateAccount.delete({ where: { id: accountId } });
  logger.info(`Corporate account deleted: ${existing.companyName}`);
}
