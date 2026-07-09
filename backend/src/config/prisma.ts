import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: env.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });
}

// In development, Node's module cache can be cleared on hot-reload, which
// would otherwise create a new PrismaClient (and a new connection pool) on
// every file change. Caching it on `global` prevents that.
export const prisma = global.__prisma ?? createPrismaClient();

if (env.isDevelopment) {
  global.__prisma = prisma;
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
