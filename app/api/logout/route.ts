import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logout successful" });

  // Clear the JWT cookie
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0), // immediately expired
  });

  return res;
}
