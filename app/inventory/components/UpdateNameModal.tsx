"use client";

import { Item } from "../types";

type UpdateNameModalProps = {
  show: boolean;
  onClose: () => void;
  updateData: {
    id: string;
    newName: string;
  };
  setUpdateData: React.Dispatch<
    React.SetStateAction<{
      id: string;
      newName: string;
    }>
  >;
  existingItems: Item[];
  onUpdate: () => void;
};

export default function UpdateNameModal({
  show,
  onClose,
  updateData,
  setUpdateData,
  existingItems,
  onUpdate,
}: UpdateNameModalProps) {
  if (!show) return null;

  const selectedItem = existingItems.find((item) => item.id === updateData.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white text-gray-900 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Update Item Name</h2>

        <select
          value={updateData.id}
          onChange={(e) =>
            setUpdateData({ id: e.target.value, newName: "" })
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

        {selectedItem && (
          <div className="mb-3 p-2 bg-gray-100 rounded border border-gray-300">
            <p className="text-sm text-gray-600">Current Name:</p>
            <p className="font-semibold">{selectedItem.name}</p>
          </div>
        )}

        <input
          type="text"
          placeholder="New Name"
          value={updateData.newName}
          onChange={(e) => setUpdateData({ ...updateData, newName: e.target.value })}
          className="w-full mb-3 p-2 rounded border border-gray-300"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={onUpdate}
            disabled={!updateData.id || !updateData.newName}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Name
          </button>
        </div>
      </div>
    </div>
  );
}
