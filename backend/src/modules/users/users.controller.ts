import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as usersService from './users.service';
import { UpdateProfileInput, AdminUpdateUserInput } from './users.types';
import { Role } from '@prisma/client';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../constants/enums';

export async function getMyProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const user = await usersService.getProfile(req.user.userId);
  sendSuccess(res, 200, 'Profile fetched.', user);
}

export async function updateMyProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const input = req.body as UpdateProfileInput;
  const user = await usersService.updateProfile(req.user.userId, input);
  sendSuccess(res, 200, 'Profile updated.', user);
}

export async function deleteMyAccount(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await usersService.deleteOwnAccount(req.user.userId);
  sendNoContent(res);
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const page = Math.max(parseInt(String(req.query.page ?? DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? DEFAULT_PAGE_SIZE), 10), 1),
    MAX_PAGE_SIZE
  );
  const search = req.query.search ? String(req.query.search) : undefined;
  const role = req.query.role ? (String(req.query.role) as Role) : undefined;

  const result = await usersService.listUsers({ page, limit, search, role });

  sendPaginated(res, 'Users fetched.', result.users, { page, limit, total: result.total });
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const user = await usersService.getUserById(req.params.id);
  sendSuccess(res, 200, 'User fetched.', user);
}

export async function adminUpdateUser(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const input = req.body as AdminUpdateUserInput;
  const user = await usersService.adminUpdateUser(
    req.params.id,
    input,
    req.user.userId,
    req.user.role
  );
  sendSuccess(res, 200, 'User updated.', user);
}

export async function adminDeleteUser(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await usersService.adminDeleteUser(req.params.id, req.user.role);
  sendNoContent(res);
}