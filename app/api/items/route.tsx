// app/api/items/route.ts
import { NextResponse } from "next/server"
import { supabase } from "@/libs/supabaseClient"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET! // make sure this is set in Vercel

// Helper to verify JWT
async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
  return payload
}

export async function GET(req: Request) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    const username: string | undefined = (payload as any)?.username;

    if (!username) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch inventory ordered by name ASC
    const { data, error } = await supabase
      .from("inventory")
      .select("id, name, sale_price")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ensure uniqueness by name (keeps first occurrence due to order ASC)
    const unique = Array.from(new Map(data.map(i => [i.name.toLowerCase(), i])).values());

    return NextResponse.json(unique, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
