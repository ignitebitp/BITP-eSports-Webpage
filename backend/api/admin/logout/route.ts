import { NextResponse } from "next/server";
import { clearAdminSessionCookie, getAdminSession } from "@/lib/auth";
import { isCrossOriginRequest } from "@/lib/api";

export async function POST(request: Request) {
  if (isCrossOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await clearAdminSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}
