"use client"

import { useState } from "react"
import { CartItem } from "@/app/types/inventory"
import CartItemRow from "./CartItemRow"

type CartSidebarProps = {
  cart: CartItem[]
  onRemove: (id: string) => void
  onPlaceOrder: (paymentMethod: string) => void
  onClearCart: () => void
  onIncreament: (id: string) => void
  onDecreament: (id: string) => void
  setDiscount: (amount: number) => void
  discount: number
  setDiscountDescription?: (desc: string) => void
  setTableNo?: (amount: number) => void
  discoundDescription?: string
  placing: boolean,
  tableNo: number
}

export default function CartSidebar({ cart, onRemove, onPlaceOrder, onClearCart, placing, onIncreament, onDecreament, setDiscount, discount, setDiscountDescription, tableNo,
  discoundDescription, setTableNo }: CartSidebarProps) {
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Online">("Cash")
  const subtotal = cart.reduce((sum, item) => sum + item.sale_price * item.quantity, 0)
  const total = Math.max(0, subtotal - discount)

  return (
    <div className="w-full h-full bg-white border-l shadow-lg p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Your Cart</h2>

      {cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <ul className="space-y-3">
              {cart.map(ci => (
                <CartItemRow key={ci.id} item={ci} onRemove={onRemove} onIncrement={onIncreament} onDecrement={onDecreament} />
              ))}
            </ul>
          </div>

          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold text-lg">Total:</p>
              <p className="font-bold text-lg">Rs. {total}</p>
            </div>

            <div className="flex flex-row justify-between gap-2">
              {/* add discount field here where user can enter discount amount and it can only applied if single item is selected otherwise disable*/}
              {/* if already discount is applied and new item is added to cart then discount should be removed */}
              <div className="mb-2 w-2/5">
                <label className="block text-sm font-semibold mb-1">Discount (Rs.):</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Discount"
                  // disabled={cart.length !== 1 }
                  value={discount == 0 ? '' : discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
              </div>

              <div className="mb-2 w-full">
                <label className="block text-sm font-semibold mb-1">Description:</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Enter description"
                  // disabled={cart.length !== 1 }
                  value={discoundDescription}
                  onChange={e => setDiscountDescription ? setDiscountDescription(e.target.value) : null}
                />
              </div>
            </div>

            <div className="flex flex-row justify-between gap-2">
              <div className="mb-2 w-2/5">
                <label className="block text-sm font-semibold mb-1">TableNo:</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Table No"
                  // disabled={cart.length !== 1 }
                  required
                  value={tableNo == 0 ? '' : tableNo}
                  onChange={e => setTableNo ? setTableNo(Number(e.target.value)) : null}
                />
              </div>

              <div className="mb-2 w-full">
                <p className="font-semibold mb-2 text-sm">Payment Method:</p>
                <div className="flex gap-2">
                  {["Cash", "Online"].map(method => (
                    <label
                      key={method}
                      className={`flex-1 cursor-pointer p-2 text-center rounded-lg border text-sm ${paymentMethod === method
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
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClearCart}
                className="flex-1 px-3 py-2 rounded bg-gray-200 text-gray-800 text-sm"
              >
                Clear
              </button>
              <button
                disabled={placing}
                className="flex-1 bg-green-600 disabled:opacity-60 text-white px-3 py-2 rounded font-semibold text-sm"
                onClick={() => onPlaceOrder(paymentMethod)}
              >
                {placing ? "Placing..." : "Place Order"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
