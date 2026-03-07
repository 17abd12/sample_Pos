"use client";

type ActionButtonsProps = {
  onAdd: () => void;
  onUpdate: () => void;
  onConfirm: () => void;
  itemsLength: number;
  loadingConfirm: boolean;
  confirmed: boolean;
};

export default function ActionButtons({
  onAdd,
  onUpdate,
  onConfirm,
  itemsLength,
  loadingConfirm,
  confirmed,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={onAdd}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium text-white"
      >
        + Add Item
      </button>
      <button
        onClick={onUpdate}
        className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-medium text-white"
      >
        Update Existing Item
      </button>
      <button
        onClick={onConfirm}
        className={`px-4 py-2 rounded-lg font-medium ${
          confirmed ? "bg-white text-black" : "bg-green-600 hover:bg-green-700 text-white"
        }`}
        disabled={itemsLength === 0 || loadingConfirm}
      >
        {loadingConfirm ? "Confirming..." : "Confirm Inventory"}
      </button>
    </div>
  );
}
