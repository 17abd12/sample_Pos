"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { CartItem } from "@/app/types/inventory"
import CartItemRow from "./CartItemRow"

type CartModalProps = {
  cart: CartItem[]
  isOpen: boolean
  onClose: () => void
  onRemove: (id: string) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onPlaceOrder: (paymentMethod: string) => void
  onClearCart: () => void
  placing: boolean
  customerEmail: string
  setCustomerEmail: (email: string) => void
}

export default function CartModal({ cart, isOpen, onClose, onRemove, onPlaceOrder, onClearCart, placing, onIncrement, onDecrement, customerEmail, setCustomerEmail }: CartModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Online">("Cash")
  if (!isOpen) return null
  const total = cart.reduce((sum, item) => sum + item.sale_price * item.quantity, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 md:hidden">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
        <button className="absolute top-3 right-3 text-gray-500 hover:text-black" onClick={onClose}>
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold mb-4">Your Cart</h2>

        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {cart.map(ci => (
                <CartItemRow key={ci.id} item={ci} onRemove={onRemove}
                  onIncrement={onIncrement} // pass from CartModal props
                  onDecrement={onDecrement} // pass from CartModal props
                />
              ))}
            </ul>

            <div className="mt-4 flex justify-between items-center border-t pt-4">
              <p className="font-bold text-lg">Total:</p>
              <p className="font-bold text-lg">Rs. {total}</p>
            </div>

            {/* Customer Email */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-1">Customer Email (optional):</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
              />
            </div>

            {/* Payment Method */}
            <div className="mt-4">
              <p className="font-semibold mb-2">Select Payment Method:</p>
              <div className="flex gap-4">
                {["Cash", "Online"].map(method => (
                  <label
                    key={method}
                    className={`flex-1 cursor-pointer p-3 text-center rounded-lg border ${paymentMethod === method
                        ? method === "Cash"
                          ? "bg-green-100 border-green-400"
                          : "bg-blue-100 border-blue-400"
                        : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method as "Cash" | "Online")}
                      className="hidden"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {cart.length > 0 && (
          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={onClearCart} className="px-4 py-2 rounded bg-gray-200 text-gray-800">
              Clear
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-800">
              Close
            </button>
            <button
              disabled={placing}
              className="bg-green-600 disabled:opacity-60 text-white px-6 py-3 rounded-lg font-semibold"
              onClick={() => onPlaceOrder(paymentMethod)}
            >
              {placing ? "Placing..." : "Place Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
