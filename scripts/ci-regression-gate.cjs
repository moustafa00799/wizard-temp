const { spawnSync } = require('child_process');

const gates = [
  ['CDKS Production Gate', 'scripts/cdks-production-gate.cjs'],
  ['Production Hardening', 'scripts/production-hardening-regression.cjs'],
  ['Production Readiness', 'scripts/production-readiness-regression.cjs'],
  ['API Golden E2E', 'scripts/api-golden-e2e.cjs'],
  ['Rule Parity', 'scripts/rule-engine-parity.cjs']
];

for (const [name, file] of gates) {
  console.log(`\n=== ${name} ===`);
  
  const r = spawnSync(process.execPath, [file], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS || '--dns-result-order=ipv4first',
      HOST: process.env.HOST || '127.0.0.1',
      PORT: process.env.PORT || '3001'
    }
  });
  
  if (r.status !== 0) {
    console.error(`CI REGRESSION GATE FAILED: ${name}`);
    process.exit(r.status || 1);
  }
}

console.log('\nCI REGRESSION GATE: PASS');