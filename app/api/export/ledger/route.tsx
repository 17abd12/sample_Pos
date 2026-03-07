import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { supabase } from "@/libs/supabaseClient";
import { verifyJwt } from "@/libs/jwt";

export async function GET(req: Request) {
  try {
    // =======================
    // 1️⃣ Auth check
    // =======================
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    if (payload.role !== "manager")
      return NextResponse.json(
        { message: "Forbidden: Managers only" },
        { status: 403 }
      );

    // =======================
    // 2️⃣ Fetch Data
    // =======================
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        added_at,
        discount,
        order_items (
          quantity,
          sale_price,
          cost_price,
          name
        )
      `
      )
      .order("added_at", { ascending: true });

    if (error) throw new Error(error.message);
    if (!orders) throw new Error("No orders found");

    // =======================
    // 3️⃣ Setup Excel
    // =======================
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Revenue Report");

    ws.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Order ID", key: "orderId", width: 10 },
      { header: "Item Name", key: "itemName", width: 25 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Sale Price", key: "salePrice", width: 12 },
      { header: "Cost Price", key: "costPrice", width: 12 },
      { header: "Revenue", key: "revenue", width: 12 },
      { header: "Total Cost", key: "cost", width: 12 },
      { header: "Profit", key: "profit", width: 12 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const fmtDate = (d: string) => new Date(d).toISOString().split("T")[0];

    // =======================
    // 4️⃣ Calculate Totals
    // =======================
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalDiscount = 0;

    for (const order of orders) {
      const orderDiscount = Number(order.discount || 0);
      totalDiscount += orderDiscount;

      for (const item of order.order_items) {
        const quantity = Number(item.quantity);
        const salePrice = Number(item.sale_price);
        const costPrice = Number(item.cost_price);

        const revenue = salePrice * quantity;
        const cost = costPrice * quantity;
        const profit = revenue - cost;

        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += profit;

        ws.addRow({
          date: fmtDate(order.added_at),
          orderId: order.id,
          itemName: item.name,
          quantity,
          salePrice,
          costPrice,
          revenue,
          cost,
          profit,
        });
      }
    }

    // =======================
    // 5️⃣ Summary Section
    // =======================
    ws.addRow([]);
    const summaryRow = ws.addRow({
      date: "TOTALS",
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalProfit,
    });
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF0CC" },
    };

    ws.addRow({
      date: "Total Discount",
      profit: totalDiscount,
    });

    const grossProfit = totalProfit - totalDiscount;
    const profitMargin = totalRevenue
      ? ((grossProfit / totalRevenue) * 100).toFixed(2)
      : "0.00";

    const grossProfitRow = ws.addRow({
      date: "Gross Profit After Discount",
      profit: grossProfit,
    });
    grossProfitRow.font = { bold: true };
    grossProfitRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF0CC" },
    };

    ws.addRow({
      date: "Profit Margin",
      profit: `${profitMargin}%`,
    });

    // Format numbers
    ["salePrice", "costPrice", "revenue", "cost", "profit"].forEach((key) => {
      ws.getColumn(key).numFmt = "#,##0.00";
    });

    // =======================
    // 6️⃣ Send Excel File
    // =======================
    const buffer = await wb.xlsx.writeBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="revenue_report.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: any) {
    console.error("❌ Export Revenue Error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
