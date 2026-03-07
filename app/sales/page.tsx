"use client";
import toast, { Toaster } from "react-hot-toast";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

type OrderItem = {
  name: string;
  sale_price: number;
  quantity: number;
};

type Order = {
  orderId: string;
  seqNo?: string;
  orderCashier: string;
  paymentMethod: string; // e.g., "Cash", "Online"
  orderDate: string;
  items: OrderItem[];
  totalBill: number;
  discount: number;
  discountDescription: string;
  totalCost: number;
  isReverseOrder?: boolean;
  hasBeenReversed?: boolean;
};

type Expense = {
  id: string;
  amount: number;
  description: string;
  added_by: string;
  added_at: string;
}

export default function OrdersTable() {
  const [allOrders, setAllOrders] = useState<Order[]>([]); // keep all data
  const [orders, setOrders] = useState<Order[]>([]); // filtered data
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalDiscount, setTotalDiscount] = useState("")
  const [reversingOrderId, setReversingOrderId] = useState<string | null>(null);

  const fetchExpense = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      console.log("Fetched expenses:", data);
      setAllExpenses(data.exp || []);
      setExpenses(data.exp || []);
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();

      const fetchedOrders = data.orders || [];
      // Process orders to mark reversed and already-reversed ones
      const processedOrders = fetchedOrders.map((order: Order) => {
        const isReverseOrder = order.items.some(item => item.quantity < 0);
        let hasBeenReversed = false;

        if (!isReverseOrder) {
          hasBeenReversed = fetchedOrders.some((other: Order) => {
            if (other.orderId === order.orderId) return false;
            // must be created after this order
            const otherDate = new Date(other.orderDate);
            const thisDate = new Date(order.orderDate);
            if (otherDate <= thisDate) return false;

            // must be a reverse (negative quantities)
            const isReverseOf = other.items.length === order.items.length &&
              other.items.every((item, i) =>
                item.name === order.items[i].name &&
                item.quantity === -order.items[i].quantity
              );

            return isReverseOf;
          });

        }
        return { ...order, isReverseOrder, hasBeenReversed };
      });

      setTotalDiscount(data.total || "")
      setAllOrders(processedOrders);
      setOrders(processedOrders);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReverseOrder = async (order: Order) => {
    if (!confirm(`Are you sure you want to reverse order?`)) return;
    try {
      setReversingOrderId(order.orderId);
      const res = await fetch("/api/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(`❌ Failed to reverse order: ${data.message || "Unknown error"}`);
        return;
      }
      toast.success("✅ Order reversed successfully!");
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Error reversing order.");
    } finally {
      setReversingOrderId(null);
    }
  };

  useEffect(() => {
    fetchExpense();
    fetchOrders();
  }, []);

  const handleFilter = () => {
    if (!startDate && !endDate) {
      setOrders(allOrders);
      return;
    }
    // const start = startDate ? new Date(startDate) : null;
    // const end = endDate ? new Date(endDate) : null;
    const TZ = process.env.NEXT_PUBLIC_TIMEZONE ?? "UTC";
    const start = startDate ? DateTime.fromISO(startDate, { zone: TZ }).startOf("day") : null;
    const end = endDate ? DateTime.fromISO(endDate, { zone: TZ }).endOf("day") : null;

    const filteredOrders = allOrders.filter((order) => {
      const orderDate = DateTime.fromISO(order.orderDate, { zone: TZ });
      if (start && orderDate < start) return false;
      if (end && orderDate > end) return false;
      return true;
    });
    setOrders(filteredOrders);

    const filteredExpenses = allExpenses.filter((expense_temp) => {
      const expDate = DateTime.fromISO(expense_temp.added_at, { zone: TZ });
      if (start && expDate < start) return false;
      if (end && expDate > end) return false;
      return true;
    });
    setExpenses(filteredExpenses);
  };

  const totalSale = orders.reduce((sum, order) => sum + order.totalBill, 0);
  const totalCost = orders.reduce((sum, order) => sum + order.totalCost, 0);
  const cashSale = orders
    .filter((order) => order.paymentMethod.toLowerCase() === "cash")
    .reduce((sum, order) => sum + order.totalBill, 0);
  const onlineSale = orders
    .filter((order) => order.paymentMethod.toLowerCase() === "online")
    .reduce((sum, order) => sum + order.totalBill, 0);

  const discountSum = orders.reduce((sum, order) => sum + (Number(order.discount) || 0), 0);
  const totalExpense = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const totalRevenue = totalSale - totalExpense - totalCost - discountSum;

  if (loading) return <p className="p-4">Loading orders...</p>;

  if (orders.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Orders</h2>

        {/* Date filters */}
        <div className="flex items-center gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium">Starting Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Closing Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <button
            onClick={handleFilter}
            className="bg-blue-600 text-white px-4 py-2 rounded mt-5"
          >
            Filter
          </button>
        </div>

        <p>No orders found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Orders</h2>

      {/* 🔹 Totals Section */}
      <div className="flex justify-end font-semibold text-lg mb-4 gap-6">
        <div>Total Sale: Rs.{totalSale}</div>
        <div>Cash Sale: Rs.{cashSale}</div>
        <div>Online Sale: Rs.{onlineSale}</div>
        <div>Total Discount Rs:{discountSum}</div>
        <div>Total Revenue Rs: {totalRevenue}</div>
        <div>Total Expense Rs: {totalExpense}</div>
      </div>

      {/* Date filters */}
      <div className="flex items-center gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium">Starting Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Closing Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          onClick={handleFilter}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-5"
        >
          Filter
        </button>
      </div>

      {/* Orders table */}
      <table className="w-full border border-gray-300 rounded-lg overflow-hidden shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2 text-left">Order ID</th>
            <th className="border px-3 py-2 text-left">Payment Method</th>
            <th className="border px-3 py-2 text-left">Cashier</th>
            <th className="border px-3 py-2 text-left">Date</th>
            <th className="border px-3 py-2 text-left">Items</th>
            <th className="border px-3 py-2 text-right">Total Bill (After Discount)</th>
            <th className="border px-3 py-2 text-right">Reverse Order</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.orderId} className="hover:bg-gray-50">
              <td className="border px-3 py-2 font-semibold">{order.seqNo ?? '0'}</td>
              <td className="border px-3 py-2">{order.paymentMethod}</td>
              <td className="border px-3 py-2">{order.orderCashier}</td>
              <td className="border px-3 py-2">
                {new Date(order.orderDate).toLocaleString()}
              </td>
              <td className="border px-3 py-2">
                <ul className="list-disc pl-5">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} — {item.quantity} × Rs.{item.sale_price}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="border px-3 py-2 text-right font-semibold">
                Rs.{order.totalBill} - {order.discount} = Rs.{order.totalBill - (Number(order.discount) || 0)}
              </td>
              <td className="border px-3 py-2 text-right">
                {order.isReverseOrder ? (
                  <span className="text-gray-400 italic">Reversed</span>
                ) : order.hasBeenReversed ? (
                  <span className="text-gray-400 italic">Already Reversed</span>
                ) : (
                  <button
                    onClick={() => handleReverseOrder(order)}
                    disabled={reversingOrderId === order.orderId}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    {reversingOrderId === order.orderId ? "Reversing..." : "Reverse"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
