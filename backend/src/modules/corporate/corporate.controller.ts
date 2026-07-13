import { Request, Response } from 'express';
import { sendSuccess, sendNoContent } from '../../utils/apiResponse';
import * as corporateService from './corporate.service';
import {
  CreateCorporateAccountSchema,
  UpdateCorporateAccountSchema,
  AddEmployeeSchema,
} from './corporate.validation';

export async function createCorporateAccount(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateCorporateAccountSchema;
  const account = await corporateService.createCorporateAccount(input);
  sendSuccess(res, 201, 'Corporate account created.', account);
}

export async function updateCorporateAccount(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateCorporateAccountSchema;
  const account = await corporateService.updateCorporateAccount(req.params.id, input);
  sendSuccess(res, 200, 'Corporate account updated.', account);
}

export async function getCorporateAccountById(req: Request, res: Response): Promise<void> {
  const account = await corporateService.getCorporateAccountById(req.params.id);
  sendSuccess(res, 200, 'Corporate account fetched.', account);
}

export async function listCorporateAccounts(req: Request, res: Response): Promise<void> {
  const accounts = await corporateService.listCorporateAccounts();
  sendSuccess(res, 200, 'Corporate accounts fetched.', accounts);
}

export async function addEmployee(req: Request, res: Response): Promise<void> {
  const { userId } = req.body as AddEmployeeSchema;
  const employee = await corporateService.addEmployee(req.params.id, userId);
  sendSuccess(res, 201, 'Employee added to corporate account.', employee);
}

export async function removeEmployee(req: Request, res: Response): Promise<void> {
  await corporateService.removeEmployee(req.params.id, req.params.userId);
  sendNoContent(res);
}

export async function listEmployees(req: Request, res: Response): Promise<void> {
  const employees = await corporateService.listEmployees(req.params.id);
  sendSuccess(res, 200, 'Employees fetched.', employees);
}

export async function getBillingSummary(req: Request, res: Response): Promise<void> {
  const { periodStart, periodEnd } = req.query as { periodStart?: string; periodEnd?: string };
  const summary = await corporateService.getBillingSummary(req.params.id, periodStart, periodEnd);
  sendSuccess(res, 200, 'Billing summary generated.', summary);
}

export async function deleteCorporateAccount(req: Request, res: Response): Promise<void> {
  await corporateService.deleteCorporateAccount(req.params.id);
  sendNoContent(res);
}
