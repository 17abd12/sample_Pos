// /app/api/me/route.ts
import { NextResponse } from "next/server";
import { verifyJwt } from "@/libs/jwt";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) {
    return NextResponse.json({ role: null });
  }

  try {
    const payload = await verifyJwt(token);
    if (!payload) return NextResponse.json({ role: null });
    return NextResponse.json({ role: (payload as any).role });
  } catch {
    return NextResponse.json({ role: null });
  }
}
