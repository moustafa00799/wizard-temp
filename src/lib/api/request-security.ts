export class RequestSecurityError extends Error {
  constructor(public readonly code: "BODY_TOO_LARGE" | "INVALID_JSON", message: string) {
    super(message);
    this.name = "RequestSecurityError";
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number.isFinite(Number(declaredLength)) && Number(declaredLength) > maxBytes) {
    throw new RequestSecurityError("BODY_TOO_LARGE", `Request body exceeds the ${maxBytes}-byte limit.`);
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new RequestSecurityError("BODY_TOO_LARGE", `Request body exceeds the ${maxBytes}-byte limit.`);
  }
  if (!raw.trim()) throw new RequestSecurityError("INVALID_JSON", "Request body must contain JSON.");

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new RequestSecurityError("INVALID_JSON", "Request body must contain valid JSON.");
  }
}
