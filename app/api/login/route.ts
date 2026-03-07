import { NextResponse } from "next/server";
import { supabase } from "@/libs/supabaseClient";
import { signJwt } from "@/libs/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { username } = body;
    const { password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Missing Full name or CMS" },
        { status: 400 }
      );
    }

    // Normalize username (lowercase + remove all spaces)
    username = username.toLowerCase().replace(/\s+/g, "");

    const { data: user, error } = await supabase
      .from("users")
      .select("username, name, password, role")
      .eq("username", username)
      .eq("password", password)
      .maybeSingle();

    console.log(user)

    if (error || !user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { message: "Server misconfigured" },
        { status: 500 }
      );
    }

    const token = await signJwt({
      username: user.username,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      message: "Login successful",
      user: { username: user.username, name: user.name, role: user.role },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;

  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json(
        { message: "Server error", error: err.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { message: "Unknown error" },
        { status: 500 }
      );
    }
  }
}
