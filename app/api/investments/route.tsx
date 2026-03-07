import { NextResponse } from "next/server";
import { supabase } from "@/libs/supabaseClient";
import { verifyJwt } from "@/libs/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, description } = body;

    if (!amount) {
      return NextResponse.json({ message: "Amount is required" }, { status: 400 });
    }

    // Get JWT from cookie
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    if (payload.role !== "manager") {
      return NextResponse.json({ message: "Forbidden: Managers only" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("investments")
      .insert([{ amount, description, added_by: payload.name }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Investment added successfully!", data }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Investment API Error:", err.message);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
