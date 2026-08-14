const {spawnSync}=require('child_process');
const gates=[
 ['CDKS Production Gate','scripts/cdks-production-gate.cjs'],
 ['Production Hardening','scripts/production-hardening-regression.cjs'],
 ['Production Readiness','scripts/production-readiness-regression.cjs'],
 ['API Golden E2E','scripts/api-golden-e2e.cjs'],
 ['Rule Parity','scripts/rule-engine-parity.cjs']
];
for(const [name,file] of gates){console.log(`\n=== ${name} ===`);const r=spawnSync(process.execPath,[file],{stdio:'inherit'});if(r.status!==0){console.error(`CI REGRESSION GATE FAILED: ${name}`);process.exit(r.status||1)}}
console.log('\nCI REGRESSION GATE: PASS');
