"use client"

import { CartItem } from "@/app/types/inventory"

type CartItemRowProps = {
  item: CartItem
  onRemove: (id: string) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
}

export default function CartItemRow({ item, onRemove, onIncrement, onDecrement }: CartItemRowProps) {
  return (
    <li className="flex justify-between items-center border-b pb-3 gap-2">
      <p className="font-semibold text-md">{item.name}</p>
      <div className="flex flex-row gap-4">
        <div className="flex items-center gap-3 text-gray-700 text-sm">
          <button
            onClick={() => onDecrement(item.id)}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 font-semibold"
          >
            -
          </button>
          <span className="font-medium">{item.quantity}</span>
          <button
            onClick={() => onIncrement(item.id)}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300font-semibold"
          >
            +
          </button>
          <span className="">× Rs. {item.sale_price}</span>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-600 hover:underline text-lg"
        >
          ❌
        </button>
      </div>
    </li>
  )
}
