import { NextResponse } from "next/server";
import { supabase } from "@/libs/supabaseClient";
import ExcelJS from "exceljs";
import { verifyJwt } from "@/libs/jwt";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Token check
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
      return NextResponse.json(
        { message: "Forbidden: Managers only" },
        { status: 403 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { message: "Missing ?type=orders|inventory" },
        { status: 400 }
      );
    }

    const PAGE_SIZE = 1000;
    let data: any[] = [];

    // ------------------------------
    // ORDERS EXPORT
    // ------------------------------
    if (type === "orders") {
      let allOrders: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from("orders")
          .select(
            `id,
            paymentMethod,
            added_by,
            added_at,
            order_items (
              name,
              sale_price,
              quantity,
              cost_price
            )`
          )
          .order("added_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        // Optional date filter
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1);
          query = query.gte("added_at", start.toISOString()).lt("added_at", end.toISOString());
        }

        const { data: orders, error } = await query;
        if (error) throw error;

        if (!orders || orders.length === 0) {
          hasMore = false;
        } else {
          allOrders = [...allOrders, ...orders];
          hasMore = orders.length === PAGE_SIZE;
          page++;
        }
      }

      // Flatten orders to rows
      data = (allOrders || []).flatMap((o: any) =>
        (o.order_items || []).map((it: any) => ({
          orderId: o.id,
          paymentMethod: o.paymentMethod,
          cashier: o.added_by,
          date: o.added_at,
          item: it.name,
          quantity: it.quantity,
          sale_price: it.sale_price,
          cost_price: it.cost_price,
          totalItemPrice: Number(it.sale_price || 0) * Number(it.quantity || 0),
        }))
      );
    }

    // ------------------------------
    // INVENTORY EXPORT
    // ------------------------------
    if (type === "inventory") {
      let allItems: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from("inventory")
          .select(
            "id, name, no_of_units, sale_price, cost_price, added_by, added_at"
          )
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        const { data: items, error } = await query;
        if (error) throw error;

        if (!items || items.length === 0) {
          hasMore = false;
        } else {
          allItems = [...allItems, ...items];
          hasMore = items.length === PAGE_SIZE;
          page++;
        }
      }

      data = allItems;
    }

    // ------------------------------
    // Expenses EXPORT
    // ------------------------------
    if (type === "expenses") {
      let allExpenses: any[] = [];
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        let query = supabase
          .from("expenses")
          .select("description, amount, added_by, added_at")
          .order("added_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        // Optional date filter
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1);
          query = query.gte("added_at", start.toISOString()).lt("added_at", end.toISOString());
        }
        const { data: expenses, error } = await query;
        if (error) throw error;
        if (!expenses || expenses.length === 0) {
          hasMore = false;
        } else {
          allExpenses = [...allExpenses, ...expenses];
          hasMore = expenses.length === PAGE_SIZE;
          page++;
        }
      }
      data = allExpenses;
    }

    if (!data.length) {
      return NextResponse.json({ message: "No data found" }, { status: 404 });
    }

    // Convert to XLSX using exceljs
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type);

    worksheet.columns = Object.keys(data[0]).map((key) => ({
      header: key,
      key,
    }));

    data.forEach((row) => worksheet.addRow(row));

    // Special handling for expenses
    if (type === "expenses") {
      // Set description column width (column A or B depending on structure)
      const descColIndex = Object.keys(data[0]).indexOf("description");
      if (descColIndex !== -1) {
        worksheet.getColumn(descColIndex + 1).width = 50; // Set width to 50 characters
      }

      // Calculate total amount
      const totalAmount = data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
      
      // Add empty row
      worksheet.addRow({});
      
      // Add total row
      const totalRow = worksheet.addRow({
        description: "Total Expenses",
        amount: totalAmount
      });
      
      // Style the total row
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" }
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error("❌ XLSX export error:", err.message);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
