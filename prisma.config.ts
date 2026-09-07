import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma 7 configuration.
 *
 * In Prisma 7 the connection URL no longer lives in `schema.prisma` — it lives
 * here, and the runtime client gets a driver adapter instead (see
 * `src/lib/db.ts`). That keeps every credential in the environment and out of
 * version control, per plan §13.7.
 *
 * DATABASE_URL is not set yet: per CONTEXT.md D4 we build against seed data
 * and the owner provisions Neon before deployment. Commands that need a live
 * database (`prisma migrate`, `prisma db push`, `prisma db seed`) will ask for
 * it; `prisma generate` does not.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),

  datasource: {
    url: env('DATABASE_URL'),
  },

  migrations: {
    path: path.join('prisma', 'migrations'),
    // §12.4: seeded with realistic sample data, not a handful of rows.
    seed: 'tsx prisma/seed.ts',
  },
});
