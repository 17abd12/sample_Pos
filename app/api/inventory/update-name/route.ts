import { NextResponse } from "next/server";
import { supabase } from "@/libs/supabaseClient";
import { verifyJwt } from "@/libs/jwt";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { itemId, newName } = body;

    // Validation
    if (!itemId || !newName || typeof newName !== "string" || newName.trim() === "") {
      return NextResponse.json(
        { message: "Item ID and valid new name are required" },
        { status: 400 }
      );
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

    // Authorization check - only managers can update names
    if (payload.role !== "manager") {
      return NextResponse.json(
        { message: "Forbidden: Managers only" },
        { status: 403 }
      );
    }

    // Check if the new name already exists for a different item
    const { data: existingItem, error: checkError } = await supabase
      .from("inventory")
      .select("id, name")
      .eq("name", newName.trim())
      .neq("id", itemId)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking for duplicate name:", checkError);
      return NextResponse.json(
        { message: "Failed to validate name", error: checkError.message },
        { status: 500 }
      );
    }

    if (existingItem) {
      return NextResponse.json(
        { message: "An item with this name already exists" },
        { status: 409 }
      );
    }

    // Update the item name
    const { data: updatedItem, error: updateError } = await supabase
      .from("inventory")
      .update({ name: newName.trim() })
      .eq("id", itemId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating item name:", updateError);
      return NextResponse.json(
        { message: "Failed to update item name", error: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedItem) {
      return NextResponse.json(
        { message: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Item name updated successfully!",
        data: updatedItem,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ API Error:", err.message);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
