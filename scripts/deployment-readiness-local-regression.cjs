/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'src/app/api/health/route.ts',
  'src/app/api/generate/v5/route.ts',
  'src/app/api/campaign-lifecycle/route.ts',
  'src/app/api/campaign-preparation/route.ts',
  'src/app/api/auth/local/login/route.ts',
  'src/app/api/auth/local/me/route.ts',
  'src/app/api/auth/local/logout/route.ts',
  'src/app/login/page.tsx',
  'src/lib/auth/local-auth.ts',
  'src/lib/db/runtime-database.ts',
];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing deployment file: ${file}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const script of ['build', 'start', 'test:security', 'test:auth:local', 'test:workspace:isolation']) {
  if (typeof packageJson.scripts?.[script] !== 'string') throw new Error(`Missing package script: ${script}`);
}

const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
for (const forbidden of ['.env', '.env.local', '.local/', 'app.sqlite']) {
  if (tracked.split('\n').some((file) => file === forbidden || file.includes(forbidden))) {
    throw new Error(`Secret or runtime state is tracked: ${forbidden}`);
  }
}

const source = requiredFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
for (const marker of [
  'blueprintOnly: true',
  'externalActionsAllowed: false',
  'budgetSpendAllowed: false',
  'marketValidated: false',
  'productionReady: false',
  'CDKS_AUTHORIZED_REVIEWER_IDS',
  'CDKS_LOCAL_AUTH_SESSION_SECRET',
]) {
  if (!source.includes(marker)) throw new Error(`Missing deployment governance marker: ${marker}`);
}

console.log(JSON.stringify({
  status: 'PASS',
  requiredFiles: requiredFiles.length,
  packageScriptsVerified: true,
  trackedSecretsOrRuntimeState: false,
  blueprintOnly: true,
  externalActionsAllowed: false,
  budgetSpendAllowed: false,
  marketValidated: false,
  productionReady: false,
  deploymentMode: 'local_staging_only',
}));
