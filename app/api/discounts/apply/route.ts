import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { discount_id, customer_email } = await req.json()

  if (!discount_id || !customer_email) {
    return NextResponse.json({ message: "discount_id and customer_email are required" }, { status: 400 })
  }

  const retailerId = (process.env.RASEED_RETAILER_ID ?? "").trim()
  if (!retailerId || retailerId === "your_retailer_id_here") {
    return NextResponse.json({ message: "RASEED_RETAILER_ID not configured" }, { status: 500 })
  }

  try {
    const baseUrl = process.env.RASEED_BASE_URL ?? "https://raseed-pos.vercel.app"
    const url = `${baseUrl}/api/pos/discounts/apply`
    const payload = { discount_id, customer_email, retailer_id: retailerId }

    console.info("[discounts/apply] outbound request", {
      url,
      payload,
    })

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const rawBody = await res.text()
    let data: any
    try {
      data = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      data = { rawBody }
    }

    if (!res.ok) {
      console.error("[discounts/apply] upstream non-OK response", {
        status: res.status,
        statusText: res.statusText,
        discount_id,
        customer_email,
        retailerId,
        url,
        payload,
        upstreamBody: data,
      })
    }
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    console.error("[discounts/apply] proxy error", {
      message: e?.message,
      stack: e?.stack,
      discount_id,
      customer_email,
      retailerId,
    })
    return NextResponse.json({ message: "Failed to apply discount", error: e?.message }, { status: 500 })
  }
}
