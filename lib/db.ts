import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to ensure we have a default user for MVP
export async function ensureDefaultUser() {
  const defaultUser = await prisma.user.findFirst({
    where: { email: 'mvp@legal-analyzer.com' }
  });

  if (!defaultUser) {
    return await prisma.user.create({
      data: {
        email: 'mvp@legal-analyzer.com',
        name: 'MVP User'
      }
    });
  }

  return defaultUser;
}