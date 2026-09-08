import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailEnabled } from '@/lib/email/send';

/**
 * Health check — plan §24.
 *
 * "A /health endpoint checking database and Redis", for the uptime monitoring
 * §24 asks for (checks every minute from multiple regions).
 *
 * Deliberately says as little as possible to an anonymous caller. A health
 * endpoint that reports library versions, connection strings, or stack traces
 * is a reconnaissance gift — the monitor only needs a status code, and a
 * human debugging has the platform logs.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {};

  // The database is the only hard dependency: without it nothing works.
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'fail';
  }

  // Email being unconfigured is a launch blocker (R6), not an outage — the
  // site sells fine without it — so it is reported without failing the check.
  checks.email = emailEnabled ? 'ok' : 'fail';

  const healthy = checks.database === 'ok';

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      // 503 so an uptime monitor treats it as down without needing to parse
      // the body (§24).
      status: healthy ? 200 : 503,
      headers: {
        // Never cached — a cached health check is not a health check.
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
