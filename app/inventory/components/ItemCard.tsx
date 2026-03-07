"use client";

import { Item } from "../types";

type ItemCardProps = {
  item: Item;
  onDelete: (id: string) => void;
};

export default function ItemCard({ item, onDelete }: ItemCardProps) {
  return (
    <div className="bg-white text-gray-900 p-4 rounded-lg shadow-md flex justify-between items-start">
      <div>
        <h2 className="text-lg font-bold">{item.name}</h2>
        <p>Cost: {item.costPrice}</p>
        <p>Sale: {item.sale_price}</p>
        <p>Units: {item.units}</p>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="text-red-500 hover:text-red-700 font-bold"
      >
        ✕
      </button>
    </div>
  );
}
