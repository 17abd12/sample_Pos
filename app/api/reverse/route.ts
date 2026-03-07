import { NextResponse } from "next/server"
import { supabase } from "@/libs/supabaseClient"
import { DateTime } from "luxon"


export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: "Missing order ID" }, { status: 400 });
    }

    // Fetch the original order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Fetch related order items
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)

    if (itemsErr || !orderItems?.length) {
      return NextResponse.json({ message: "No items found for this order" }, { status: 404 })
    }

    const TZ = process.env.NEXT_PUBLIC_TIMEZONE ?? "UTC";

    // Create reverse order record in Supabase
    const nowPKT = DateTime.now()
      .setZone(TZ)
      .toISO({ suppressMilliseconds: true })

    // Get the current cycle start time (for seq_no consistency)
    const now = DateTime.now().setZone(TZ);
    let cycleStart: DateTime;
    if (now.hour < 8) {
      cycleStart = now.minus({ days: 1 }).set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
    } else {
      cycleStart = now.set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
    }
    const startOfCycle = cycleStart.toISO({ suppressMilliseconds: true });
    const endOfCycle = now.toISO({ suppressMilliseconds: true });

    // Get the next seq_no for reverse order
    const { data: seqRows, error: seqErr } = await supabase
      .from("orders")
      .select("seq_no")
      .gte("added_at", startOfCycle)
      .lte("added_at", endOfCycle)
      .order("seq_no", { ascending: false })
      .limit(1);

    let nextSeq = "0";
    if (!seqErr && seqRows && seqRows.length > 0) {
      const prevSeq = Number(seqRows[0].seq_no);
      if (!isNaN(prevSeq)) {
        nextSeq = String(prevSeq + 1);
      }
    }

    const { data: reverseOrder, error: reverseErr } = await supabase
      .from("orders")
      .insert([
        {
          name: `Reverse of ${order.name}`,
          added_by: order.added_by,
          paymentMethod: order.paymentMethod,
          added_at: nowPKT,
          discount: order.discount ? -Math.abs(order.discount) : 0,
          discount_description: order.discount_description || "",
          seq_no: nextSeq,
          table_no: order.table_no || 0,
        },
      ])
      .select()
      .single()

    if (reverseErr || !reverseOrder) {
      return NextResponse.json({ message: "Failed to create reverse order", error: reverseErr?.message }, { status: 500 })
    }

    // Insert reverse order items (negative quantities)
    const reverseItemsPayload = orderItems.map((it) => ({
      order_id: reverseOrder.id,
      name: it.name,
      cost_price: it.cost_price,
      sale_price: it.sale_price,
      quantity: -Math.abs(it.quantity),
    }))

    const { error: revItemsErr } = await supabase
      .from("order_items")
      .insert(reverseItemsPayload)

    if (revItemsErr) {
      return NextResponse.json({ message: "Failed to insert reverse order items", error: revItemsErr.message }, { status: 500 })
    }

    // Increase inventory for each item
    for (const item of orderItems) {
      const { data: invRow, error: invErr } = await supabase
        .from("inventory")
        .select("id, name, no_of_units, cost_price, sale_price")
        .eq("name", item.name)
        .single()

      if (invErr || !invRow) continue

      const updatedUnits = invRow.no_of_units + item.quantity
      const { error: updErr } = await supabase
        .from("inventory")
        .update({ no_of_units: updatedUnits })
        .eq("id", invRow.id)


    }

    return NextResponse.json({ message: "Reverse order created successfully", reverseOrderId: reverseOrder.id }, { status: 201 })
  } catch (e: any) {
    console.error("❌ reverse order error:", e)
    return NextResponse.json({ message: "Server error", error: e.message }, { status: 500 })
  }
}
