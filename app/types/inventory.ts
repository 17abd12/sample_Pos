export type InventoryItem = {
  id: string
  name: string
  cost_price: number
  sale_price: number
}

export type CartItem = InventoryItem & { quantity: number }
