import { PrismaClient } from '@prisma/client';

// Validate environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to ensure we have a default user for MVP
export async function ensureDefaultUser() {
  try {
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
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Failed to connect to database. Please check your DATABASE_URL.');
  }
}