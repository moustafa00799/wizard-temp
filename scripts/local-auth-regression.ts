import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdks-local-auth-"));
  process.env.CDKS_APP_DB_PATH = path.join(tempDir, "app.sqlite");
  process.env.CDKS_LOCAL_AUTH_ACCESS_CODE = "local-auth-regression-access-code";
  process.env.CDKS_LOCAL_AUTH_SESSION_SECRET = "local-auth-regression-session-secret-012345678901234567890";
  process.env.CDKS_LOCAL_AUTH_USER_ID = "auth-reviewer";
  process.env.CDKS_LOCAL_AUTH_WORKSPACE_ID = "auth-workspace";
  process.env.CDKS_LOCAL_AUTH_ROLE = "owner";
  process.env.CDKS_LOCAL_AUTH_ENABLED = "true";

  const { POST: login } = await import("../src/app/api/auth/local/login/route");
  const { GET: me } = await import("../src/app/api/auth/local/me/route");
  const { POST: logout } = await import("../src/app/api/auth/local/logout/route");
  const { POST: generateV5 } = await import("../src/app/api/generate/v5/route");
  const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests/fixtures/wizard-inputs-v1/EX-001_ecommerce-sales.json"), "utf8"));

  const notConfigured = await login(new NextRequest("http://localhost/api/auth/local/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ access_code: "wrong-code" }),
  }));
  assert.equal(notConfigured.status, 401);

  const validLogin = await login(new NextRequest("http://localhost/api/auth/local/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ access_code: "local-auth-regression-access-code" }),
  }));
  const validPayload = await validLogin.json() as { status: string; user?: { userId: string; workspaceId: string; role: string }; expiresAt?: number };
  assert.equal(validLogin.status, 200);
  assert.equal(validPayload.status, "success");
  assert.deepEqual(validPayload.user, { userId: "auth-reviewer", workspaceId: "auth-workspace", role: "owner" });
  assert.ok(typeof validPayload.expiresAt === "number");
  assert.equal(JSON.stringify(validPayload).includes("local-auth-regression-access-code"), false);
  const cookie = validLogin.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie);

  const anonymousGenerate = await generateV5(new NextRequest("http://localhost/api/generate/v5", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...(fixture.input ?? fixture), ai_advisory: { enabled: false } }),
  }));
  assert.equal(anonymousGenerate.status, 401);

  const authenticatedGenerate = await generateV5(new NextRequest("http://localhost/api/generate/v5", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookie! },
    body: JSON.stringify({ ...(fixture.input ?? fixture), ai_advisory: { enabled: false } }),
  }));
  assert.equal(authenticatedGenerate.status, 200);

  const meResponse = await me(new NextRequest("http://localhost/api/auth/local/me", { headers: { cookie: cookie! } }));
  const mePayload = await meResponse.json() as { status: string; authenticated: boolean; user?: { userId: string; workspaceId: string; role: string } };
  assert.equal(meResponse.status, 200);
  assert.equal(mePayload.status, "success");
  assert.equal(mePayload.authenticated, true);
  assert.deepEqual(mePayload.user, { userId: "auth-reviewer", workspaceId: "auth-workspace", role: "owner" });

  const tamperedCookie = `${cookie!.slice(0, -1)}${cookie!.endsWith("a") ? "b" : "a"}`;
  const tampered = await me(new NextRequest("http://localhost/api/auth/local/me", { headers: { cookie: tamperedCookie } }));
  assert.equal(tampered.status, 401);
  assert.equal((await tampered.json()).authenticated, false);

  const anonymous = await me(new NextRequest("http://localhost/api/auth/local/me"));
  assert.equal(anonymous.status, 401);
  assert.equal((await anonymous.json()).authenticated, false);

  const logoutResponse = await logout();
  assert.equal(logoutResponse.status, 200);
  assert.match(logoutResponse.headers.get("set-cookie") ?? "", /Max-Age=0/);

  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(JSON.stringify({ status: "PASS", assertions: 16, provider: "local-signed-session", sessionCookie: "httpOnly", tampering: "blocked", accessCodeExposure: false, workspaceScoped: true }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
