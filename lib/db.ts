import { PrismaClient } from '@prisma/client';

// Validate environment variables
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL environment variable is required in production. Please set it in your Vercel environment variables.');
  } else {
    console.warn('DATABASE_URL not found. Please check your .env file.');
  }
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Add connection pooling for better performance in serverless
  ...(process.env.NODE_ENV === 'production' && {
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to ensure we have a default user for MVP
export async function ensureDefaultUser() {
  try {
    // Check if database is accessible first
    await prisma.$connect();
    
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
    
    // In production, throw the error to fail fast
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // In development, return a mock user to allow development without DB
    return {
      id: 'dev-user',
      email: 'mvp@legal-analyzer.com',
      name: 'MVP User',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

// Helper function to safely disconnect from database
export async function disconnectDb() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}