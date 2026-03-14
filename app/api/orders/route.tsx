// app/api/orders/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/libs/supabaseClient"
import { DateTime } from "luxon"
import { verifyJwt } from "@/libs/jwt"


type IncomingItem = { id: string; quantity: number }

// ----------------- POST (Create Order) -----------------

export async function POST(req: Request) {
  try {
    const { items, orderName, paymentMethod, discount, discountDescription, tableNo, customerEmail } =
      (await req.json()) as {
        items: IncomingItem[];
        orderName?: string;
        paymentMethod?: "Cash" | "Online";
        discount?: number;
        discountDescription?: string;
        tableNo?: number;
        customerEmail?: string;
      };

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "No items in order" }, { status: 400 });
    }

    if (!paymentMethod || !["Cash", "Online"].includes(paymentMethod)) {
      return NextResponse.json({ message: "Invalid payment method" }, { status: 400 });
    }

    // Verify JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    const username: string | undefined = (payload as any)?.username;
    if (!username) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    // Get user info
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("name")
      .eq("username", username)
      .single();

    if (userErr || !userRow) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const userId = userRow.name;

    // Combine duplicate items
    const qtyMap = new Map<string, number>();
    for (const it of items) {
      if (!it?.id || !Number.isInteger(it.quantity) || it.quantity <= 0) {
        return NextResponse.json({ message: "Invalid item payload" }, { status: 400 });
      }
      qtyMap.set(it.id, (qtyMap.get(it.id) ?? 0) + it.quantity);
    }
    const ids = [...qtyMap.keys()];

    // Fetch inventory
    const { data: invRows, error: invErr } = await supabase
      .from("inventory")
      .select("id, name, cost_price, sale_price, no_of_units")
      .in("id", ids);

    if (invErr)
      return NextResponse.json({ message: "Inventory fetch failed", error: invErr.message }, { status: 500 });

    if (!invRows || invRows.length !== ids.length)
      return NextResponse.json({ message: "Some items not found or missing" }, { status: 400 });

    // Stock check
    for (const row of invRows) {
      const need = qtyMap.get(row.id)!;
      if (row.no_of_units < need) {
        return NextResponse.json(
          { message: `Insufficient stock for ${row.name}: have ${row.no_of_units}, need ${need}` },
          { status: 400 }
        );
      }
    }

    // Get current time in configured timezone
    const now = DateTime.now().setZone(process.env.NEXT_PUBLIC_TIMEZONE ?? "UTC");
    const nowISO = now.toISO({ suppressMilliseconds: true });

    // Determine the current cycle start time (8 AM today or 8 AM yesterday)
    // If current time is before 8 AM, we use yesterday's 8 AM
    // If current time is after 8 AM, we use today's 8 AM
    let cycleStart: DateTime;
    if (now.hour < 8) {
      // Before 8 AM, use yesterday's 8 AM
      cycleStart = now.minus({ days: 1 }).set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
    } else {
      // After 8 AM, use today's 8 AM
      cycleStart = now.set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
    }

    const cycleEnd = now; // Current time

    const startOfCycle = cycleStart.toISO({ suppressMilliseconds: true });
    const endOfCycle = cycleEnd.toISO({ suppressMilliseconds: true });

    const { data: seqRows, error: seqErr } = await supabase
      .from("orders")
      .select("seq_no")
      .gte("added_at", startOfCycle)
      .lte("added_at", endOfCycle)
      .order("seq_no", { ascending: false })
      .limit(1);

    if (seqErr) {
      console.error("Seq fetch error:", seqErr);
      return NextResponse.json({ message: "Failed to get seq_no", error: seqErr.message }, { status: 500 });
    }


    
    let nextSeqNum = 0;
    if (seqRows && seqRows.length > 0) {
      const prevSeq = Number(seqRows[0].seq_no);
      nextSeqNum = isNaN(prevSeq) ? 0 : prevSeq + 1;
    }

    // Keep number for DB logic, but use string for sheet/form payloads
    const nextSeq = String(nextSeqNum);
    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert([
        {
          name: orderName ?? "Order",
          added_by: userId,
          paymentMethod,
          added_at: nowISO,
          discount: discount || 0,
          discount_description: discountDescription || "",
          table_no: tableNo,
          seq_no: nextSeq,
        },
      ])
      .select()
      .single();

    if (orderErr || !order)
      return NextResponse.json({ message: "Failed to create order", error: orderErr?.message }, { status: 500 });

    // Insert order items
    const orderItemsPayload = invRows.map((row) => ({
      order_id: order.id,
      name: row.name,
      cost_price: row.cost_price,
      sale_price: row.sale_price,
      quantity: qtyMap.get(row.id)!,
    }));

    const { error: oiErr } = await supabase.from("order_items").insert(orderItemsPayload);
    if (oiErr)
      return NextResponse.json({ message: "Failed to insert order items", error: oiErr.message }, { status: 500 });

    // Update inventory
    for (const row of invRows) {
      const newUnits = row.no_of_units - qtyMap.get(row.id)!;
      const { error: updErr } = await supabase.from("inventory").update({ no_of_units: newUnits }).eq("id", row.id);
      if (updErr)
        return NextResponse.json(
          { message: `Failed to update stock for ${row.name}`, error: updErr.message },
          { status: 500 }
        );
    }

    // Call Raseed webhook if customer email is provided
    if (customerEmail && customerEmail.trim()) {
      try {
        const retailerId = process.env.RASEED_RETAILER_ID
        const branchId = process.env.RASEED_BRANCH_ID
        if (retailerId && branchId && retailerId !== "your_retailer_id_here" && branchId !== "your_branch_id_here") {
          const billNumber = `ORDER-${order.id}`
          const subtotal = invRows.reduce((sum: number, row: any) => sum + row.sale_price * qtyMap.get(row.id)!, 0)
          const totalAmount = Math.max(0, subtotal - (discount || 0))

          const webhookPayload = {
            retailer_id: retailerId,
            branch_id: branchId,
            bill_number: billNumber,
            customer_email: customerEmail.trim(),
            total_amount: totalAmount,
            payment_method: paymentMethod === "Cash" ? "CASH" : "ONLINE",
            items: invRows.map((row: any) => ({
              name: row.name,
              quantity: qtyMap.get(row.id)!,
              price: row.sale_price,
            })),
          }

          const baseUrl = process.env.RASEED_BASE_URL ?? "https://raseed-pos.vercel.app"
          console.log("[orders/webhook] sending receipt webhook", {
            orderId: order.id,
            customerEmail: customerEmail.trim(),
            retailerId,
            branchId,
            endpoint: `${baseUrl}/api/pos/receipts`,
            totalAmount,
          })
          const webhookRes = await fetch(`${baseUrl}/api/pos/receipts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
          })
          const webhookText = await webhookRes.text()
          console.log("[orders/webhook] webhook response", {
            orderId: order.id,
            status: webhookRes.status,
            statusText: webhookRes.statusText,
            body: webhookText,
          })
          if (!webhookRes.ok) {
            console.error("[orders/webhook] webhook non-OK", {
              orderId: order.id,
              status: webhookRes.status,
              statusText: webhookRes.statusText,
              body: webhookText,
            })
          }
        } else {
          console.error("[orders/webhook] skipped due to missing config", {
            hasRetailerId: Boolean(retailerId),
            hasBranchId: Boolean(branchId),
            retailerId,
            branchId,
          })
        }
      } catch (webhookErr: any) {
        console.error("[orders/webhook] webhook error", {
          orderId: order.id,
          message: webhookErr?.message,
          stack: webhookErr?.stack,
        })
      }
    }

    return NextResponse.json(
      { message: "Order placed", orderId: order.id, seq_no: nextSeq, paymentMethod: order.paymentMethod, userId: userId },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("❌ orders POST error:", e);
    return NextResponse.json({ message: "Server error", error: e?.message || String(e) }, { status: 500 });
  }
}

// ----------------- GET (List Orders) -----------------
// app/api/orders/route.ts

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const PAGE_SIZE = 1000
    let allOrders: any[] = []
    let page = 0
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from("orders")
        .select(
          `id,
        paymentMethod,
        added_by,
        added_at,
        discount,
        discount_description,
        seq_no,
          order_items (
            name,
            sale_price,
            quantity,
            cost_price
          )`
        )
        .order("added_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      // Apply date filtering if provided
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setDate(end.getDate() + 1)
        query = query
          .gte("added_at", start.toISOString())
          .lt("added_at", end.toISOString())
      }

      const { data: orders, error: orderErr } = await query

      if (orderErr) {
        return NextResponse.json(
          { message: "Failed to fetch orders", error: orderErr.message },
          { status: 500 }
        )
      }

      if (!orders || orders.length === 0) {
        hasMore = false
      } else {
        allOrders = [...allOrders, ...orders]
        hasMore = orders.length === PAGE_SIZE
        page++
      }
    }

    // Format orders
    const formatted = allOrders.map((o: any) => ({
      orderId: o.id,
      seqNo: o.seq_no,
      paymentMethod: o.paymentMethod,
      orderCashier: o.added_by,
      orderDate: o.added_at,
      items: o.order_items || [],
      totalBill: (o.order_items || []).reduce(
        (sum: number, it: any) =>
          sum + Number(it.sale_price || 0) * Number(it.quantity || 0),
        0
      ),
      discount: o.discount || 0,
      discountDescription: o.discount_description || "",
      totalCost: (o.order_items || []).reduce(
        (sum: number, it: any) =>
          sum + Number(it.cost_price || 0) * Number(it.quantity || 0),
        0
      ),
    }))


    const { data: discountSum } = await supabase
      .from("orders")
      .select("discount")

    const total = (discountSum ?? []).reduce(
      (sum: number, row: any) => sum + (Number(row.discount) || 0),
      0
    )

    return NextResponse.json({ orders: formatted, total }, { status: 200 })
  } catch (e: any) {
    console.error("❌ orders GET error:", e)
    return NextResponse.json(
      { message: "Server error", error: e?.message || String(e) },
      { status: 500 }
    )
  }
}