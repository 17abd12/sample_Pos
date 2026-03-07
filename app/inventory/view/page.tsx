"use client"

import { useEffect, useState } from "react"

type InventoryItem = {
  id: string
  name: string
  no_of_units: number
  sale_price: number
  cost_price: number
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/inventory")
        const data = await res.json()
        setItems(data.items || [])
      } catch (err) {
        console.error("❌ Error fetching inventory:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  if (loading) {
    return <p className="p-6">Loading inventory...</p>
  }

  // Calculate totals
  const totalSale = items.reduce(
    (sum, item) => sum + item.no_of_units * item.sale_price,
    0
  )
  const totalCost = items.reduce(
    (sum, item) => sum + item.no_of_units * item.cost_price,
    0
  )

  return (
    <div className="p-6">
      {/* Header with totals on right */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📦 Inventory</h1>
        <div className="text-right bg-gray-100 p-3 rounded shadow-md">
          <p className="font-semibold">Total Sale Price: {totalSale}</p>
          <p className="font-semibold">Total Cost Price: {totalCost}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Item Name
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right">
                Units
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right">
                Sale Price
              </th>
              {/* <th className="border border-gray-300 px-4 py-2 text-right">
                Cost Price
              </th> */}
              <th className="border border-gray-300 px-4 py-2 text-right">
                Total Sale
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right">
                Total Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const itemTotalSale = item.no_of_units * item.sale_price
              const itemTotalCost = item.no_of_units * item.cost_price
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {item.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {item.no_of_units}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {item.sale_price}
                  </td>
                  {/* <td className="border border-gray-300 px-4 py-2 text-right">
                    {item.cost_price}
                  </td> */}
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {itemTotalSale}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {itemTotalCost}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
