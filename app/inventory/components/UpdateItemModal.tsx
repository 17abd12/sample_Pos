"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

import { Item } from "../types";
import ItemCard from "../components/ItemCard";
import AddItemModal from "../components/AddItemModal";
import UpdateUnitsModal from "../components/UpdateUnitModal";
// import UpdatePricesModal from "../components/UpdatePricesModal";
import UpdatePricesModal from "./UpdatePricesModal";
import ActionButtons from "../components/ActionButton";

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showPricesModal, setShowPricesModal] = useState(false);
  const [existingItems, setExistingItems] = useState<Item[]>([]);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    costPrice: "",
    salePrice: "",
    units: "",
  });

  const [updateData, setUpdateData] = useState({
    id: "",
    costPrice: "",
    salePrice: "",
    units: "",
  });

  // Load saved items
  useEffect(() => {
    const saved = localStorage.getItem("inventory");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(items));
  }, [items]);

  // Fetch existing items
  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => setExistingItems(data))
      .catch((err) => console.error("❌ Error fetching items:", err));
  }, []);

  // Handlers
  const handleSaveItem = () => {
    if (!formData.name || !formData.costPrice || !formData.salePrice || !formData.units) return;

    const newItem: Item = {
      id: Date.now().toString(),
      name: formData.name,
      costPrice: parseFloat(formData.costPrice),
      sale_price: parseFloat(formData.salePrice),
      units: parseInt(formData.units),
    };

    setItems([...items, newItem]);
    setFormData({ name: "", costPrice: "", salePrice: "", units: "" });
    setShowModal(false);
  };

  // Update Units
  const handleUpdateUnits = () => {
    if (!updateData.id || !updateData.units) return;

    const selectedItem = existingItems.find((i) => i.id === updateData.id);
    if (!selectedItem) return;

    const updatedItem: Item = {
      ...selectedItem,
      units: parseInt(updateData.units),
    };

    setItems([...items, updatedItem]);
    setUpdateData({ id: "", costPrice: "", salePrice: "", units: "" });
    setShowUnitsModal(false);
    toast.success("✅ Units updated locally! Confirm inventory to save.");
  };

  // Update Prices
  const handleUpdatePrices = () => {
    if (!updateData.id || !updateData.costPrice || !updateData.salePrice) return;

    const selectedItem = existingItems.find((i) => i.id === updateData.id);
    if (!selectedItem) return;

    const updatedItem: Item = {
      ...selectedItem,
      costPrice: parseFloat(updateData.costPrice),
      sale_price: parseFloat(updateData.salePrice),
    };

    setItems([...items, updatedItem]);
    setUpdateData({ id: "", costPrice: "", salePrice: "", units: "" });
    setShowPricesModal(false);
    toast.success("✅ Prices updated locally! Confirm inventory to save.");
  };

  const handleDelete = (id: string) => setItems(items.filter((item) => item.id !== id));

  const handleConfirmInventory = async () => {
    if (items.length === 0) return;
    setLoadingConfirm(true);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error("❌ Failed: " + error.message);
        return;
      }

      await res.json();
      toast.success("✅ Inventory confirmed and saved!");
      setItems([]);
      localStorage.removeItem("inventory");
      setConfirmed(true);
    } catch (err) {
      console.error("❌ Error saving inventory:", err);
      toast.error("Error saving inventory!");
    } finally {
      setLoadingConfirm(false);
    }
  };

  return (
    <div className="p-6 min-h-screen text-white">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>

      <ActionButtons
        onAdd={() => setShowModal(true)}
        onUpdate={() => setShowUnitsModal(true)} // keep original update for units
        onConfirm={handleConfirmInventory}
        itemsLength={items.length}
        loadingConfirm={loadingConfirm}
        confirmed={confirmed}
      />

      {/* Extra button for price updates */}
      <button
        onClick={() => setShowPricesModal(true)}
        className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
      >
        Update Prices
      </button>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onDelete={handleDelete} />
        ))}
      </div>

      <AddItemModal
        show={showModal}
        onClose={() => setShowModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveItem}
      />

      <UpdateUnitsModal
        show={showUnitsModal}
        onClose={() => setShowUnitsModal(false)}
        updateData={updateData}
        setUpdateData={setUpdateData}
        existingItems={existingItems}
        onUpdate={handleUpdateUnits}
      />

      <UpdatePricesModal
        show={showPricesModal}
        onClose={() => setShowPricesModal(false)}
        updateData={updateData}
        setUpdateData={setUpdateData}
        existingItems={existingItems}
        onUpdate={handleUpdatePrices}
      />
    </div>
  );
}
