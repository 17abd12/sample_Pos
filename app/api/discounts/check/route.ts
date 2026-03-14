import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const customerEmail = searchParams.get("customer_email")

  if (!customerEmail) {
    return NextResponse.json({ message: "customer_email is required" }, { status: 400 })
  }

  const retailerId = (process.env.RASEED_RETAILER_ID ?? "").trim()
  if (!retailerId || retailerId === "your_retailer_id_here") {
    return NextResponse.json({ message: "RASEED_RETAILER_ID not configured" }, { status: 500 })
  }

  try {
    const baseUrl = process.env.RASEED_BASE_URL ?? "https://raseed-pos.vercel.app"
    const url = `${baseUrl}/api/pos/discounts/check?customer_email=${encodeURIComponent(customerEmail)}&retailer_id=${encodeURIComponent(retailerId)}`

    console.info("[discounts/check] outbound request", {
      customerEmail,
      retailerId,
      url,
    })

    const res = await fetch(url, { cache: "no-store" })
    const rawBody = await res.text()
    let data: any
    try {
      data = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      data = { rawBody }
    }

    if (!res.ok) {
      console.error("[discounts/check] upstream non-OK response", {
        status: res.status,
        statusText: res.statusText,
        customerEmail,
        retailerId,
        url,
        upstreamBody: data,
      })
    }
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    console.error("[discounts/check] proxy error", {
      message: e?.message,
      stack: e?.stack,
      customerEmail,
      retailerId,
    })
    return NextResponse.json({ message: "Failed to check discounts", error: e?.message }, { status: 500 })
  }
}
