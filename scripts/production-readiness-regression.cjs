const cases = [
  { id: 'PR-001', input: { final_confirmed_inputs: false, tracking_status: 'ready', conversion_destination: 'website' }, expected: 'blocked' },
  { id: 'PR-002', input: { final_confirmed_inputs: true, tracking_status: 'missing', conversion_destination: 'website' }, expected: 'blocked' },
  { id: 'PR-003', input: { final_confirmed_inputs: true, tracking_status: 'issues', conversion_destination: 'website' }, expected: 'blocked' },
  { id: 'PR-004', input: { final_confirmed_inputs: true, tracking_status: 'ready', conversion_destination: '' }, expected: 'review' },
  { id: 'PR-005', input: { final_confirmed_inputs: true, tracking_status: 'ready', conversion_destination: 'website' }, expected: 'ready' },
];

// استقبال المتغيرات من الـ Workflow أو السكريبت الرئيسي لمنع خطأ ECONNREFUSED
const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || '3001';
const base = `http://${host}:${port}/api/generate`;

(async () => {
  let pass = 0;
  for (const c of cases) {
    try {
      const r = await fetch(base, { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify(c.input) 
      });
      const j = await r.json();
      const d = j?.data?.cdks_readiness;
      const ok = r.ok && d?.value === c.expected && d?.authority === 'READINESS_POLICY' && typeof d?.rule_id === 'string';
      console.log(`${ok ? 'PASS' : 'FAIL'} ${c.id} readiness=${d?.value} rule=${d?.rule_id}`);
      if (ok) pass++;
    } catch (err) {
      console.error(`FAIL ${c.id} connection error: ${err.message}`);
    }
  }
  console.log(`PRODUCTION_READINESS ${pass}/${cases.length} PASS`);
  process.exitCode = pass === cases.length ? 0 : 1;
})();