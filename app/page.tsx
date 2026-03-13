"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { InventoryItem, CartItem } from "@/app/types/inventory";
import CartButton from "@/app/components/CartButton";
import InventoryGrid from "@/app/components/InventoryGrid";
import CartSidebar from "./components/CartSideBar";
import CartModal from "@/app/components/CartModal";

export default function OrdersPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [discount, setDiscount] = useState<number>(0);
  const [tableNo, setTableNo] = useState<number>(0);
  const [discoundDescription, setDiscountDescription] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Load cart
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch inventory
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoadingInventory(true);
        const res = await fetch("/api/inventory");
        const data = await res.json();

        // Map and filter items with no_of_units > 0
        const filteredItems = (data?.items || [])
          .filter((r: any) => Number(r.no_of_units) > 0)
          .map((r: any) => ({
            id: r.id,
            name: r.name,
            cost_price: Number(r.cost_price),
            sale_price: Number(r.sale_price),
            no_of_units: Number(r.no_of_units),
          }));

        setItems(filteredItems);
      } catch (e) {
        console.error("Failed to load inventory:", e);
      } finally {
        setLoadingInventory(false);
      }
    };
    fetchItems();
  }, []);

  // Cart handlers
  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const found = prev.find((ci) => ci.id === item.id);
      let updatedCart;

      if (found) {
        updatedCart = prev.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        updatedCart = [...prev, { ...item, quantity: 1 }];
      }

      if (updatedCart.length > 1) {
        setDiscount(0);
        setDiscountDescription("");
      }

      return updatedCart;
    });
    setSelectedItems((prev) =>
      prev.includes(item.id) ? prev : [...prev, item.id]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((ci) => ci.id !== id));
    setSelectedItems((prev) => prev.filter((itemId) => itemId !== id)); // reset color
  };
  // Increment item quantity
  const incrementItem = (id: string) => {
    setCart((prev) =>
      prev.map((ci) =>
        ci.id === id ? { ...ci, quantity: ci.quantity + 1 } : ci
      )
    );
  };

  // Decrement item quantity (minimum 1)
  const decrementItem = (id: string) => {
    setCart((prev) =>
      prev.map((ci) =>
        ci.id === id ? { ...ci, quantity: Math.max(1, ci.quantity - 1) } : ci
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
    setSelectedItems([]);
    setDiscount(0);
    setDiscountDescription("");
  };

  const totalItems = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  // Generate bill HTML for thermal printer
  const generateBillHTML = (orderData: any) => {
    const subtotal = cart.reduce((sum, ci) => sum + (ci.sale_price * ci.quantity), 0);
    const total = subtotal - discount;
    const currentDate = new Date().toLocaleString('en-US', { timeZone: process.env.NEXT_PUBLIC_TIMEZONE ?? 'UTC' });


    if (orderData?.seq_no !== undefined && orderData?.seq_no !== null) {
      const seqStr = String(orderData.seq_no);
      orderData.seq_no = seqStr.padStart(6, "0");
    }


    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page { size: 80mm auto; margin: 0; }

          body { 
            font-family: 'Arial', 'Verdana', sans-serif; 
            font-size: 15px; 
            width: 80mm; 
            margin: 0; 
            padding: 5mm; 
            line-height: 1.4; 
            color: #000;
          }

          .header { 
            text-align: center; 
            font-weight: 700; 
            font-size: 18px; 
            margin-bottom: 6px; 
            text-transform: uppercase;
          }

          .address { 
            font-size: 13px; 
            text-align: center; 
            margin-bottom: 8px; 
          }

          .phone { 
            text-align: center;  
            margin-bottom: 12px; 
            font-size: 14px; 
          }

          hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 8px 0;
          }

          .order-details { 
            font-size: 13px; 
            margin-bottom: 10px; 
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin-bottom: 5px;
          }

          th, td {
            text-align: left;
            padding: 2px 4px;  /* Added horizontal padding */
          }

          th {
            border-bottom: 1px solid #000;
            font-weight: bold;
          }

          /* Qty column */
          td:nth-child(2), th:nth-child(2) {
            text-align: center;
            width: 15%;
          }

          /* Unit Price column */
          td:nth-child(3), th:nth-child(3) {
            text-align: right;
            width: 25%;
          }

          /* Price column */
          td:nth-child(4), th:nth-child(4) {
            text-align: right;
            width: 25%;
            padding-right: 4px;
          }

          .total { 
            text-align: right; 
            font-weight: bold; 
            font-size: 16px;
            margin-top: 10px;
          }

          .footer { 
            margin-top: 18px; 
            font-size: 12px; 
            text-align: center; 
          }
        </style>
      </head>

      <body>
        <div style="text-align:center;">
        <img src="/logo.png" alt="Logo" style="width:80px;height:80px;margin-bottom:5px;" />
      </div>
        <div class="header">THE SMOKE CHAMBER</div>
        <div class="phone">+92 335 5157375</div>
        
        <hr/>
        <div class="order-details">
          <div><b>Order ID:</b> ${orderData.seq_no}</div>
          <div><b>Table No:</b> ${tableNo}</div>
          <div><b>Date/Time:</b> ${currentDate}</div>
           <div><b>Cashier Info:</b> ${orderData.userId}</div>
            <div><b>Payment Method:</b> ${orderData.paymentMethod}</div>
          <div><b>Description:</b> ${discoundDescription}</div>
          
        </div>
        <hr/>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map(ci => `
              <tr class="item-row">
                <td>${ci.name}</td>
                <td>${ci.quantity}</td>
                <td>${ci.sale_price.toFixed(0)}</td>
                <td>${(ci.sale_price * ci.quantity).toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <hr/>
        <div class="total">
          Subtotal: ${subtotal.toFixed(0)}<br>
          ${discount > 0 ? `Discount: -${discount.toFixed(0)}<br>` : ''}
          <span style="font-size:17px;">Total: ${total.toFixed(0)}</span>
        </div>

        <hr/>
        <div class="footer">
          Thank you for dining with us!<br>
          Please come again.
        </div>
        
        <script>
          window.onload = function() { 
            window.print(); 
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
    </html>
  `;
  };


  // Place order
  const handlePlaceOrder = async (paymentMethod: string) => {
    if (cart.length === 0) return alert("No items in cart!");

    try {
      setPlacing(true);
      const payload = {
        orderName: "Customer Order",
        items: cart.map((ci) => ({ id: ci.id, quantity: ci.quantity })),
        paymentMethod,
        discount: discount || 0,
        discountDescription: discoundDescription || "",
        tableNo: tableNo || 0
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(
          `❌ Failed: ${data?.message || "Unknown error"}${data?.error ? ` — ${data.error}` : ""}`
        );
        return;
      }


      // Auto-print bill
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generateBillHTML(data));
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          printWindow.print(); // send twice manually
          toast.success("🧾 Two copies sent to printer!");
          setTimeout(() => printWindow.close(), 1000);
        };
      } else {
        toast.error("Failed to open print window. Please allow popups and try again.");
      }


      clearCart();
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(`❌ Error placing order: ${e?.message || e}`);
    } finally {
      setPlacing(false);
    }
  };

  // Filter items based on search
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Main Content Area */}
      <div className="flex-1 md:w-[70%] p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🛒 Place Order</h1>
          <CartButton
            totalItems={totalItems}
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loadingInventory ? (
          <div className="text-center py-10 text-gray-500">
            Loading inventory...
          </div>
        ) : (
          <>
            <InventoryGrid
              items={filteredItems}
              onAddToCart={addToCart}
              selectedItems={selectedItems}
            />

            {/* Mobile Place Order Button */}
            <div className="mt-6 md:hidden">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={cart.length === 0}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                Place Order
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cart Sidebar - Desktop */}
      <div className="hidden md:block md:w-[30%] h-full">
        <CartSidebar
          cart={cart}
          onIncreament={incrementItem}
          onDecreament={decrementItem}
          onRemove={removeFromCart}
          onPlaceOrder={handlePlaceOrder}
          onClearCart={clearCart}
          placing={placing}
          setDiscount={setDiscount}
          discount={discount}
          setDiscountDescription={setDiscountDescription}

          tableNo={tableNo}
          setTableNo={setTableNo}
          discoundDescription={discoundDescription}
        />
      </div>

      {/* Cart Modal - Mobile */}
      <CartModal
        cart={cart}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRemove={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        onIncrement={incrementItem}
        onDecrement={decrementItem}
        onClearCart={clearCart}
        placing={placing}
      />
    </div>
  );
}