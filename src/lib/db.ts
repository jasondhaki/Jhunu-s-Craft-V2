import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma client singleton.
 *
 * Prisma 7 takes a driver adapter rather than a `url` in the schema. On
 * Vercel every request may hit a fresh serverless instance, so the client is
 * cached on `globalThis` in development to avoid exhausting Postgres
 * connections through hot-reload (plan §12.2).
 *
 * Use Neon's POOLED connection string here. The direct one is for migrations.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and fill it in — see CONTEXT.md Q9.',
  );
}

function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    // Slow queries surface in development; production stays quiet and is
    // covered by Sentry instead (§24).
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
