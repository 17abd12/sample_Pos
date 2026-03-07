"use client"

import { InventoryItem } from "@/app/types/inventory"

type InventoryGridProps = {
  items: InventoryItem[]
  onAddToCart: (item: InventoryItem) => void
  selectedItems: string[]
}

export default function InventoryGrid({ items, onAddToCart, selectedItems }: InventoryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map(item => {
        const isSelected = selectedItems.includes(item.id)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onAddToCart(item)}
            className="text-left cursor-pointer border rounded-xl p-4 bg-white shadow hover:shadow-lg transition"
          >
            <h2 className="text-lg font-bold mb-2">{item.name}</h2>
            <p className={`text-3xl font-extrabold ${isSelected ? "text-green-600" : "text-blue-600"}`}>
              Rs. {item.sale_price}
            </p>
          </button>
        )
      })}
    </div>
  )
}
