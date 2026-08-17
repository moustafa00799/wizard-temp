const { spawnSync } = require('child_process');[cite: 2]

const gates = [[cite: 2]
  ['CDKS Production Gate', 'scripts/cdks-production-gate.cjs'],[cite: 2]
  ['Production Hardening', 'scripts/production-hardening-regression.cjs'],[cite: 2]
  ['Production Readiness', 'scripts/production-readiness-regression.cjs'],[cite: 2]
  ['API Golden E2E', 'scripts/api-golden-e2e.cjs'],[cite: 2]
  ['Rule Parity', 'scripts/rule-engine-parity.cjs'][cite: 2]
];[cite: 2]

for (const [name, file] of gates) {[cite: 2]
  console.log(`\n=== ${name} ===`);[cite: 2]
  
  // تمرير تفضيلات IPv4 والـ Port لجميع السكريبتات الفرعية
  const r = spawnSync(process.execPath, [file], {[cite: 2]
    stdio: 'inherit',[cite: 2]
    env: {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS || '--dns-result-order=ipv4first',
      HOST: process.env.HOST || '127.0.0.1',
      PORT: process.env.PORT || '3001'
    }
  });
  
  if (r.status !== 0) {[cite: 2]
    console.error(`CI REGRESSION GATE FAILED: ${name}`);[cite: 2]
    process.exit(r.status || 1);[cite: 2]
  }
}

console.log('\nCI REGRESSION GATE: PASS');[cite: 2]