"use client";

type AddItemModalProps = {
  show: boolean;
  onClose: () => void;
  formData: {
    name: string;
    costPrice: string;
    salePrice: string;
    units: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      costPrice: string;
      salePrice: string;
      units: string;
    }>
  >;
  onSave: () => void;
};

export default function AddItemModal({
  show,
  onClose,
  formData,
  setFormData,
  onSave,
}: AddItemModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white text-gray-900 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add New Item</h2>
        <input
          type="text"
          placeholder="Item Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full mb-3 p-2 rounded border border-gray-300"
        />
        <input
          type="number"
          placeholder="Cost Price per Unit"
          value={formData.costPrice}
          onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
          className="w-full mb-3 p-2 rounded border border-gray-300"
        />
        <input
          type="number"
          placeholder="Sale Price per Unit"
          value={formData.salePrice}
          onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
          className="w-full mb-3 p-2 rounded border border-gray-300"
        />
        <input
          type="number"
          placeholder="No of Units"
          value={formData.units}
          onChange={(e) => setFormData({ ...formData, units: e.target.value })}
          className="w-full mb-3 p-2 rounded border border-gray-300"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
