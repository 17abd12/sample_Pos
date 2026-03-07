"use client";

import { Item } from "../types";

type UpdateUnitsModalProps = {
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

export default function UpdateUnitsModal({
  show,
  onClose,
  updateData,
  setUpdateData,
  existingItems,
  onUpdate,
}: UpdateUnitsModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white text-gray-900 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Update Item Units</h2>

        <select
          value={updateData.id}
          onChange={(e) =>
            setUpdateData({ ...updateData, id: e.target.value, units: "" })
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
          placeholder="New Units"
          value={updateData.units}
          onChange={(e) => setUpdateData({ ...updateData, units: e.target.value })}
          className="w-full mb-3 p-2 rounded border border-gray-300"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={onUpdate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Update Units
          </button>
        </div>
      </div>
    </div>
  );
}
