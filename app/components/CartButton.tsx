"use client"

import { ShoppingCart } from "lucide-react"

type CartButtonProps = {
  totalItems: number
  onClick: () => void
}

export default function CartButton({ totalItems, onClick }: CartButtonProps) {
  return (
    <button className="relative md:hidden" onClick={onClick}>
      <ShoppingCart className="w-8 h-8" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
          {totalItems}
        </span>
      )}
    </button>
  )
}
