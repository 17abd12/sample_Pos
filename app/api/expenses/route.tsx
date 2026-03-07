import { NextResponse } from "next/server";
import { supabase } from "@/libs/supabaseClient";
import { verifyJwt } from "@/libs/jwt";
import { DateTime } from "luxon";

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
      .from("expenses")
      .insert([{ amount, description, added_by: payload.name }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Expense added successfully!", data }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Expense API Error:", err.message);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // const { searchParams } = new URL(req.url);
    // const startDate = searchParams.get("startDate");
    // const endDate = searchParams.get("endDate");

    const PAGE_SIZE = 1000;
    let allExpenses: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from("expenses")
        .select("*")
        .order("added_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      // if (startDate && endDate) {
      //   const start = new Date(startDate);
      //   start.setHours(0, 0, 0, 0);
      //   const end = new Date(endDate);
      //   end.setDate(end.getDate() + 1);
      //   end.setHours(0, 0, 0, 0);
      //   query = query.gte("added_at", start.toISOString()).lt("added_at", end.toISOString());
      // }
      const { data: expenses, error: expenseErr } = await query;
      if (expenseErr) {
        return NextResponse.json(
          { message: "Failed to fetch expenses", error: expenseErr.message },
          { status: 500 }
        );
      }
      if (expenses && expenses.length > 0) {
        allExpenses = [...allExpenses, ...expenses];
        hasMore = expenses.length === PAGE_SIZE;
        page++;
      } else {
        hasMore = false;
      }
    }
    return NextResponse.json({ exp: allExpenses }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Expenses API Error:", err.message);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}