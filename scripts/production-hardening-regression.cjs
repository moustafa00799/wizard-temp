const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const route = fs.readFileSync(path.join(root, 'src/app/api/generate/route.ts'), 'utf8');
const files = [];
function walk(d){ for(const n of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,n.name); if(n.isDirectory()) walk(p); else if(/\.(ts|tsx|js|jsx)$/.test(n.name)) files.push(p);} }
walk(path.join(root,'src'));
const source = files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const forbidden = ['strategyRules','campaign-engine','rules/legacy-v1','legacy-v1'];
const violations = forbidden.filter(x=>source.includes(x));
if(violations.length){ console.error('FAIL legacy authority references:', violations.join(', ')); process.exit(1); }
for (const marker of ['resolveCDKSDecisions(canonicalWizard)','resolveCDKSReadiness(canonicalWizard)','cdks_decisions: cdksDecisions','cdks_readiness: cdksReadiness']) {
  if(!route.includes(marker)){ console.error('FAIL missing production authority marker:', marker); process.exit(1); }
}
if(route.includes('const rulesBlueprint = generateBlueprint')){ console.error('FAIL duplicate full rules generation remains'); process.exit(1); }
console.log('PASS: legacy authority isolation');
console.log('PASS: production authority/readiness integration');
console.log('PASS: duplicate rules generation removed');
