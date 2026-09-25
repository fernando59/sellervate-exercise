// One command from a fresh clone to a seeded local database:
//   pnpm bootstrap
//
// Starts the local Supabase stack (the Supabase CLI runs it in Docker), resets the
// database so migrations and the seed are applied, and writes apps/web/.env.local
// with the local API URL and the anon key if that file does not exist yet.
//
// It only ever writes the anon key: the app talks to Supabase with the user's JWT,
// and the service_role key must not end up in the app's environment. An existing
// .env.local only gets DEMO_USER_PASSWORD appended when it is missing, so a clone
// from before the user switcher existed keeps working.

import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const envPath = 'apps/web/.env.local';
const examplePath = 'apps/web/.env.example';

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  execSync('docker info', { stdio: 'ignore' });
} catch {
  console.error('Docker is not running. Start Docker Desktop and run `pnpm bootstrap` again.');
  process.exit(1);
}

run('pnpm exec supabase start');
run('pnpm exec supabase db reset');

if (existsSync(envPath)) {
  const current = readFileSync(envPath, 'utf8');
  if (/^DEMO_USER_PASSWORD=/m.test(current)) {
    console.log(`\n${envPath} already exists, leaving it untouched.`);
  } else {
    const line = readFileSync(examplePath, 'utf8').match(/^DEMO_USER_PASSWORD=.*$/m)[0];
    appendFileSync(envPath, `${current.endsWith('\n') ? '' : '\n'}${line}\n`);
    console.log(`\n${envPath} already exists; added DEMO_USER_PASSWORD for the user switcher.`);
  }
} else {
  const status = JSON.parse(
    execSync('pnpm exec supabase status -o json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
  );
  const env = readFileSync(examplePath, 'utf8')
    .replace(/^NEXT_PUBLIC_SUPABASE_URL=.*$/m, `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}`)
    .replace(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*$/m, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${status.ANON_KEY}`);
  writeFileSync(envPath, env);
  console.log(`\nWrote ${envPath} with the local API URL and anon key.`);
}

console.log('\nReady. Run `pnpm dev` and open http://localhost:3000');
