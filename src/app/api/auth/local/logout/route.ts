import { NextResponse } from "next/server";
import { clearedLocalSessionCookieOptions } from "@/lib/auth/local-auth";

export async function POST() {
  const response = NextResponse.json({ status: "success", authenticated: false });
  response.cookies.set(clearedLocalSessionCookieOptions());
  return response;
}
