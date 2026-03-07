"use client";

import { Item } from "../types";

type UpdatePricesModalProps = {
  show: boolean;
  onClose: () => void;
  updateData: {
    id: string;
    costPrice: string;
    salePrice: string;
    units: string;
  };
  setUpdateData: React.Dispatch<
    React.SetStateAction<{
      id: string;
      costPrice: string;
      salePrice: string;
      units: string;
    }>
  >;
  existingItems: Item[];
  onUpdate: () => void;
};

export default function UpdatePricesModal({
  show,
  onClose,
  updateData,
  setUpdateData,
  existingItems,
  onUpdate,
}: UpdatePricesModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white text-gray-900 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Update Item Prices</h2>

        <select
          value={updateData.id}
          onChange={(e) =>
            setUpdateData({ ...updateData, id: e.target.value, costPrice: "", salePrice: "" })
          }
          className="w-full mb-3 p-2 rounded border border-gray-300"
        >
          <option value="">Select Item</option>
          {existingItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="New Cost Price"
          value={updateData.costPrice}
          onChange={(e) => setUpdateData({ ...updateData, costPrice: e.target.value })}
          className="w-full mb-3 p-2 rounded border border-gray-300"
        />

        <input
          type="number"
          placeholder="New Sale Price"
          value={updateData.salePrice}
          onChange={(e) => setUpdateData({ ...updateData, salePrice: e.target.value })}
          className="w-full mb-3 p-2 rounded border border-gray-300"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={onUpdate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Update Prices
          </button>
        </div>
      </div>
    </div>
  );
}
