/**
 * Creates or updates an admin user.
 *
 *   npx tsx scripts/create-admin.ts <email> <name> [OWNER|MANAGER|STAFF]
 *
 * The password is read from stdin rather than passed as an argument, so it
 * does not land in shell history or in the process list where other users on
 * the machine could read it (§13.7).
 *
 * §13.2 requires TOTP on every admin account before launch. That flow is
 * Phase 3; this script prints the reminder rather than letting it be
 * forgotten.
 */

import 'dotenv/config';
import { createInterface } from 'node:readline';
import { PrismaClient, AdminRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/lib/password';

const connectionString =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Parameters come from src/lib/password.ts, so a hash created here is
// guaranteed to verify at login — previously this was three copies kept in
// sync by a comment.

/**
 * Reads every line of stdin up front when stdin is NOT a terminal.
 *
 * Without this, piping the password in (`printf 'pw\npw\n' | tsx ...`) breaks:
 * the first readline interface buffers BOTH lines, so the second `question`
 * never fires, the event loop drains, and the process exits 0 having done
 * nothing at all. Reading once and handing out lines avoids that entirely.
 */
async function readPipedLines(): Promise<string[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8').split(/\r?\n/);
}

function prompt(question: string, silent = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  if (silent) {
    // Suppress echo so the password is not shown on screen.
    const output = rl as unknown as { output: NodeJS.WriteStream };
    const originalWrite = output.output.write.bind(output.output);
    let muted = false;
    output.output.write = ((chunk: string, ...args: unknown[]) => {
      if (muted) return true;
      return originalWrite(chunk, ...(args as []));
    }) as typeof output.output.write;

    return new Promise((resolve) => {
      originalWrite(question);
      muted = true;
      rl.question('', (answer) => {
        muted = false;
        originalWrite('\n');
        rl.close();
        resolve(answer);
      });
    });
  }

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const [emailArg, nameArg, roleArg] = process.argv.slice(2);

  if (!emailArg || !nameArg) {
    console.error(
      'Usage: npx tsx scripts/create-admin.ts <email> <name> [OWNER|MANAGER|STAFF]',
    );
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const role = (roleArg?.toUpperCase() ?? 'OWNER') as AdminRole;

  if (!Object.values(AdminRole).includes(role)) {
    console.error(`Invalid role "${roleArg}". Use OWNER, MANAGER, or STAFF.`);
    process.exit(1);
  }

  let password: string;
  let confirm: string;

  if (process.stdin.isTTY) {
    password = await prompt(`Password for ${email}: `, true);
    confirm = await prompt('Confirm password: ', true);
  } else {
    // Piped input: read it all at once (see readPipedLines).
    const [first = '', second = ''] = await readPipedLines();
    password = first;
    confirm = second || first;
  }

  if (password !== confirm) {
    console.error('Passwords do not match.');
    process.exit(1);
  }

  // §13.2: minimum 8 characters, no silly composition rules. The
  // breached-password check against HaveIBeenPwned is Phase 3.
  if (password.length < 8) {
    console.error('Password must be at least 8 characters (§13.2).');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await db.adminUser.upsert({
    where: { email },
    update: { passwordHash, name: nameArg, role, isActive: true },
    create: { email, name: nameArg, role, passwordHash },
  });

  // Any existing sessions belong to the old password — invalidate them
  // (§13.2, "session invalidation on password change").
  const { count } = await db.adminSession.deleteMany({ where: { adminUserId: user.id } });

  console.log(`\n✔ Admin ready: ${user.email} (${user.role})`);
  if (count > 0) console.log(`  ${count} existing session(s) invalidated.`);
  console.log('\n  Sign in at /admin/login');
  console.log(
    '  ⚠ Two-factor authentication is NOT enabled yet. §13.2 requires TOTP on',
  );
  console.log('    every admin account before launch — see §25 pre-launch checklist.\n');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
