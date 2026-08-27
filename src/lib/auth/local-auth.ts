import { createHmac, timingSafeEqual } from "node:crypto";

export const LOCAL_SESSION_COOKIE = "cdks_local_session";
export const LOCAL_SESSION_TTL_SECONDS = 8 * 60 * 60;

export type LocalRole = "owner" | "admin" | "reviewer" | "analyst" | "viewer";

export type LocalAuthSession = {
  userId: string;
  workspaceId: string;
  role: LocalRole;
  issuedAt: number;
  expiresAt: number;
};

export class LocalAuthError extends Error {
  constructor(public readonly code: "NOT_CONFIGURED" | "INVALID_CREDENTIALS" | "INVALID_SESSION" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "LocalAuthError";
  }
}

function base64url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function unbase64url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sessionSecret(): string {
  const secret = process.env.CDKS_LOCAL_AUTH_SESSION_SECRET ?? "";
  if (secret.length < 32) throw new LocalAuthError("NOT_CONFIGURED", "Local Authentication session secret is not configured.");
  return secret;
}

function configuredAccessCode(): string {
  const accessCode = process.env.CDKS_LOCAL_AUTH_ACCESS_CODE ?? "";
  if (accessCode.length < 12) throw new LocalAuthError("NOT_CONFIGURED", "Local Authentication access code is not configured.");
  return accessCode;
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function equalSecret(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function safeId(value: string, fallback: string): string {
  return /^[A-Za-z0-9._:-]{1,120}$/.test(value) ? value : fallback;
}

function configuredSessionIdentity(): Pick<LocalAuthSession, "userId" | "workspaceId" | "role"> {
  const role = process.env.CDKS_LOCAL_AUTH_ROLE;
  return {
    userId: safeId(process.env.CDKS_LOCAL_AUTH_USER_ID ?? process.env.CDKS_DEFAULT_WORKSPACE_USER_ID ?? "user-local-owner", "user-local-owner"),
    workspaceId: safeId(process.env.CDKS_LOCAL_AUTH_WORKSPACE_ID ?? process.env.CDKS_DEFAULT_WORKSPACE_ID ?? "workspace-local-cdks", "workspace-local-cdks"),
    role: role === "admin" || role === "reviewer" || role === "analyst" || role === "viewer" ? role : "owner",
  };
}

export function createLocalSession(accessCode: string): LocalAuthSession {
  if (process.env.CDKS_LOCAL_AUTH_ENABLED === "false") throw new LocalAuthError("NOT_CONFIGURED", "Local Authentication is disabled.");
  if (!equalSecret(configuredAccessCode(), accessCode)) throw new LocalAuthError("INVALID_CREDENTIALS", "Invalid local access code.");
  const now = Math.floor(Date.now() / 1000);
  const identity = configuredSessionIdentity();
  const session: LocalAuthSession = { ...identity, issuedAt: now, expiresAt: now + LOCAL_SESSION_TTL_SECONDS };
  return session;
}

export function serializeLocalSession(session: LocalAuthSession): string {
  const payload = base64url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function parseLocalSession(value: string | undefined): LocalAuthSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !equalSecret(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(unbase64url(payload)) as Partial<LocalAuthSession>;
    if (
      typeof session.userId !== "string" ||
      typeof session.workspaceId !== "string" ||
      typeof session.role !== "string" ||
      typeof session.issuedAt !== "number" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null;
    if (!["owner", "admin", "reviewer", "analyst", "viewer"].includes(session.role)) return null;
    return session as LocalAuthSession;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: Request): LocalAuthSession | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${LOCAL_SESSION_COOKIE}=`));
  return parseLocalSession(cookie?.slice(LOCAL_SESSION_COOKIE.length + 1));
}

export function requireLocalSession(request: Request): LocalAuthSession {
  if (process.env.CDKS_LOCAL_AUTH_ENABLED === "false") throw new LocalAuthError("NOT_CONFIGURED", "Local Authentication is disabled.");
  const session = getSessionFromRequest(request);
  if (!session) throw new LocalAuthError("INVALID_SESSION", "A valid Local Staging session is required.");
  return session;
}

export function localSessionCookieOptions(value: string) {
  return {
    name: LOCAL_SESSION_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LOCAL_SESSION_TTL_SECONDS,
  };
}

export function clearedLocalSessionCookieOptions() {
  return {
    name: LOCAL_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
